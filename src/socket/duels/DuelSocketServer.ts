import { Server, Namespace } from 'socket.io';
import logger from '../../logger';
import duelService, { DuelService } from '../../services/games/duel/DuelService';
import duelRaceService, { DuelRaceService } from '../../services/games/duel/DuelRaceService';
import duelLobbyCache, { DuelLobbyCache } from '../../services/games/duel/DuelLobbyCache';
import { subscribeDuelRaceFinished } from '../../services/games/duel/DuelEventBridge';
import { logDuelLifecycle } from '../../services/games/duel/duelLifecycleLog';
import { DuelConfig, DuelResponse } from '../../services/games/duel/duel.types';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../exceptions';
import { socketAuthMiddleware } from '../middleware/socketAuth';
import {
  DuelClientToServerEvents,
  DuelServerToClientEvents,
  SocketWithUser,
} from '../socket.types';

const DISCONNECT_GRACE_MS = 30_000;
const countdownTimers = new Map<string, NodeJS.Timeout>();

function duelRoom(duelId: string) {
  return `duel:${duelId}`;
}

function disconnectTimerKey(duelId: string, userSub: string) {
  return `${duelId}:${userSub}`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected duel error';
}

export class DuelSocketServer {
  private readonly namespace: Namespace<DuelClientToServerEvents, DuelServerToClientEvents>;
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    io: Server,
    private readonly service: DuelService,
    private readonly raceService: DuelRaceService,
    private readonly lobbyCache: DuelLobbyCache
  ) {
    this.namespace = io.of('/duels');
    this.namespace.use(socketAuthMiddleware);
    this.registerHandlers();

    this.lobbyCache.subscribe((duelId, state) => {
      this.namespace.to(duelRoom(duelId)).emit('lobby:state', state);
    });

    subscribeDuelRaceFinished((duelId, results) => {
      this.namespace.to(duelRoom(duelId)).emit('race:finished', { results });
    });
  }

  private registerHandlers() {
    this.namespace.on('connection', (socket: SocketWithUser) => {
      socket.on('lobby:join', (payload) => {
        this.handleJoin(socket, payload?.duelId).catch((error) => {
          this.emitLobbyError(socket, error);
        });
      });

      socket.on('lobby:leave', (payload) => {
        this.handleLeave(socket, payload?.duelId).catch((error) => {
          this.emitLobbyError(socket, error);
        });
      });

      socket.on('lobby:ready', (payload) => {
        this.handleReady(socket, payload?.duelId, payload?.ready).catch((error) => {
          this.emitLobbyError(socket, error);
        });
      });

      socket.on('lobby:update-config', (payload) => {
        this.handleUpdateConfig(socket, payload?.duelId, payload?.config).catch((error) => {
          this.emitLobbyError(socket, error);
        });
      });

      socket.on('lobby:start', (payload) => {
        this.handleStart(socket, payload?.duelId).catch((error) => {
          this.emitLobbyError(socket, error);
        });
      });

      socket.on('race:advance', (payload) => {
        this.handleRaceAdvance(socket, payload).catch((error) => {
          this.emitRaceError(socket, error);
        });
      });

      socket.on('race:forfeit', (payload) => {
        this.handleRaceForfeit(socket, payload?.duelId).catch((error) => {
          this.emitRaceError(socket, error);
        });
      });

      socket.on('race:rejoin', (payload) => {
        this.handleRaceRejoin(socket, payload?.duelId).catch((error) => {
          this.emitRaceError(socket, error);
        });
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket).catch((error) => {
          logger.warn('Failed to handle duel socket disconnect', { error });
        });
      });
    });
  }

  private async handleJoin(socket: SocketWithUser, duelId?: string) {
    if (!duelId) {
      throw new BadRequestError('duelId is required');
    }

    const userSub = socket.data.userSub;
    const isParticipant = await this.service.isParticipant(duelId, userSub);
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this duel');
    }

    if (socket.data.duelId && socket.data.duelId !== duelId) {
      await socket.leave(duelRoom(socket.data.duelId));
    }

    await socket.join(duelRoom(duelId));
    socket.data.duelId = duelId;

    this.clearDisconnectTimer(duelId, userSub);
    await this.service.clearDisconnected(userSub, duelId);

    const cached = await this.lobbyCache.get(duelId);
    if (cached) {
      socket.emit('lobby:state', cached);
    }

    await this.broadcastLobbyState(duelId);

    const rejoinState = await this.raceService.getRejoinState(duelId, userSub);
    if (rejoinState.phase === 'racing' && rejoinState.payload) {
      socket.emit('race:started', rejoinState.payload);
    }
    if (rejoinState.phase === 'finished' && rejoinState.results) {
      socket.emit('race:finished', { results: rejoinState.results });
    }
  }

  private async handleLeave(socket: SocketWithUser, duelId?: string) {
    if (!duelId) {
      throw new BadRequestError('duelId is required');
    }

    await this.assertInRoom(socket, duelId);
    this.clearDisconnectTimer(duelId, socket.data.userSub);

    let state;
    try {
      state = await this.service.leaveLobby(socket.data.userSub, duelId);
    } catch (error) {
      if (error instanceof ConflictError && error.message === 'Cannot leave during countdown') {
        return;
      }

      throw error;
    }

    await socket.leave(duelRoom(duelId));
    socket.data.duelId = undefined;

    this.clearCountdownTimer(duelId);
    await this.broadcastLobbyState(duelId, state);
  }

  private async handleReady(socket: SocketWithUser, duelId?: string, ready?: boolean) {
    if (!duelId || typeof ready !== 'boolean') {
      throw new BadRequestError('duelId and ready are required');
    }

    await this.assertInRoom(socket, duelId);
    await this.service.setReady(socket.data.userSub, duelId, ready);
    await this.broadcastLobbyState(duelId);
  }

  private async handleUpdateConfig(
    socket: SocketWithUser,
    duelId?: string,
    config?: Record<string, unknown>
  ) {
    if (!duelId || !config) {
      throw new BadRequestError('duelId and config are required');
    }

    await this.assertInRoom(socket, duelId);
    await this.service.updateConfig(
      socket.data.userSub,
      duelId,
      config as Partial<DuelConfig>
    );
    await this.broadcastLobbyState(duelId);
  }

  private async handleStart(socket: SocketWithUser, duelId?: string) {
    if (!duelId) {
      throw new BadRequestError('duelId is required');
    }

    await this.assertInRoom(socket, duelId);

    const state = await this.service.startLobby(socket.data.userSub, duelId);
    await this.broadcastLobbyState(duelId, state);
    this.scheduleCountdown(duelId, state.config.countdownSec);
  }

  private async handleRaceAdvance(
    socket: SocketWithUser,
    payload?: {
      duelId?: string;
      cardIndex?: number;
      answer?: string;
      durationMs?: number;
      clientTimestamp?: number;
    }
  ) {
    if (
      !payload?.duelId ||
      typeof payload.cardIndex !== 'number' ||
      typeof payload.answer !== 'string' ||
      typeof payload.durationMs !== 'number'
    ) {
      throw new BadRequestError('duelId, cardIndex, answer, and durationMs are required');
    }

    await this.assertInRoom(socket, payload.duelId);

    const result = await this.raceService.advance({
      duelId: payload.duelId,
      userSub: socket.data.userSub,
      cardIndex: payload.cardIndex,
      answer: payload.answer,
      durationMs: payload.durationMs,
      clientTimestamp: payload.clientTimestamp,
    });

    if (!result.duplicate) {
      socket.emit('race:graded', {
        cardIndex: result.progress.cardIndex,
        correct: result.correct,
      });
    }

    this.namespace.to(duelRoom(payload.duelId)).emit('race:progress', result.progress);

    if (result.finished && result.results) {
      this.namespace.to(duelRoom(payload.duelId)).emit('race:finished', {
        results: result.results,
      });
    }
  }

  private async handleRaceForfeit(socket: SocketWithUser, duelId?: string) {
    if (!duelId) {
      throw new BadRequestError('duelId is required');
    }

    await this.assertInRoom(socket, duelId);

    const results = await this.raceService.forfeit(duelId, socket.data.userSub);
    this.namespace.to(duelRoom(duelId)).emit('race:finished', { results });
  }

  private async handleRaceRejoin(socket: SocketWithUser, duelId?: string) {
    if (!duelId) {
      throw new BadRequestError('duelId is required');
    }

    await this.assertInRoom(socket, duelId);

    const state = await this.raceService.getRejoinState(duelId, socket.data.userSub);
    socket.emit('race:rejoin-state', state);

    if (state.phase === 'racing' && state.payload) {
      socket.emit('race:started', state.payload);
    }

    if (state.phase === 'finished' && state.results) {
      socket.emit('race:finished', { results: state.results });
    }
  }

  private async handleDisconnect(socket: SocketWithUser) {
    const duelId = socket.data.duelId;
    const userSub = socket.data.userSub;

    if (!duelId || !userSub) {
      return;
    }

    await this.service.markDisconnected(userSub, duelId);
    logDuelLifecycle('duel.disconnect', { duelId, userSub });
    await this.broadcastLobbyState(duelId);

    const timerKey = disconnectTimerKey(duelId, userSub);
    if (this.disconnectTimers.has(timerKey)) {
      return;
    }

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(timerKey);
      this.handleDisconnectGraceExpired(userSub, duelId).catch((error) => {
        logger.warn('Failed to finalize duel disconnect grace period', { duelId, userSub, error });
      });
    }, DISCONNECT_GRACE_MS);

    this.disconnectTimers.set(timerKey, timer);
  }

  private async handleDisconnectGraceExpired(userSub: string, duelId: string) {
    const results = await this.raceService.forfeitDueToDisconnect(duelId, userSub);
    if (results) {
      this.namespace.to(duelRoom(duelId)).emit('race:finished', { results });
      return;
    }

    await this.service.handleDisconnectGraceExpired(userSub, duelId);
    this.clearCountdownTimer(duelId);
    await this.broadcastLobbyState(duelId);
  }

  private scheduleCountdown(duelId: string, countdownSec: number) {
    this.clearCountdownTimer(duelId);

    const timer = setTimeout(() => {
      countdownTimers.delete(duelId);
      this.service
        .transitionToRacing(duelId)
        .then(async (state) => {
          if (!state) {
            return;
          }

          await this.broadcastLobbyState(duelId, state);
          await this.emitRaceStarted(duelId);
        })
        .catch((error) => {
          logger.warn('Failed to transition duel to racing', { duelId, error });
        });
    }, countdownSec * 1000);

    countdownTimers.set(duelId, timer);
  }

  private clearCountdownTimer(duelId: string) {
    const timer = countdownTimers.get(duelId);
    if (timer) {
      clearTimeout(timer);
      countdownTimers.delete(duelId);
    }
  }

  private clearDisconnectTimer(duelId: string, userSub: string) {
    const timerKey = disconnectTimerKey(duelId, userSub);
    const timer = this.disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(timerKey);
    }
  }

  private async emitRaceStarted(duelId: string) {
    const sockets = await this.namespace.in(duelRoom(duelId)).fetchSockets();

    await Promise.all(
      sockets.map(async (remoteSocket) => {
        const userSub = remoteSocket.data.userSub as string | undefined;
        if (!userSub) {
          return;
        }

        const payload = await this.raceService.getRacePayload(duelId, userSub);
        remoteSocket.emit('race:started', payload);
      })
    );
  }

  private async broadcastLobbyState(duelId: string, state?: DuelResponse) {
    const snapshot = state ?? (await this.service.getLobbySnapshot(duelId));
    await this.lobbyCache.set(duelId, snapshot);
    this.namespace.to(duelRoom(duelId)).emit('lobby:state', snapshot);
    await this.lobbyCache.publishRemote(duelId, snapshot);
  }

  private async assertInRoom(socket: SocketWithUser, duelId: string) {
    if (socket.data.duelId !== duelId) {
      throw new ForbiddenError('Join the duel lobby before sending events');
    }

    if (!socket.rooms.has(duelRoom(duelId))) {
      throw new ForbiddenError('You are not connected to this duel room');
    }
  }

  private emitLobbyError(socket: SocketWithUser, error: unknown) {
    this.emitTypedError(socket, 'lobby:error', error);
  }

  private emitRaceError(socket: SocketWithUser, error: unknown) {
    this.emitTypedError(socket, 'race:error', error);
  }

  private emitTypedError(
    socket: SocketWithUser,
    event: 'lobby:error' | 'race:error',
    error: unknown
  ) {
    if (error instanceof NotFoundError) {
      socket.emit(event, { message: error.message });
      return;
    }

    if (
      error instanceof BadRequestError ||
      error instanceof ForbiddenError ||
      error instanceof ConflictError
    ) {
      socket.emit(event, { message: error.message });
      return;
    }

    logger.warn('Unhandled duel socket error', { error, event });
    socket.emit(event, { message: toErrorMessage(error) });
  }
}

export function createDuelSocketServer(
  io: Server,
  service: DuelService = duelService,
  raceService: DuelRaceService = duelRaceService,
  lobbyCache: DuelLobbyCache = duelLobbyCache
) {
  return new DuelSocketServer(io, service, raceService, lobbyCache);
}
