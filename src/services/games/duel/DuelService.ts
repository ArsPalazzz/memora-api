import { v4 as uuidV4 } from 'uuid';
import duelRepository, { DuelRepository } from '../../../databases/postgre/entities/game/DuelRepository';
import cardRepository, { CardRepository } from '../../../databases/postgre/entities/card/CardRepository';
import friendshipRepository, {
  FriendshipRepository,
} from '../../../databases/postgre/entities/user/FriendshipRepository';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../../exceptions';
import { mapAvatarUrl } from '../../../utils/avatarUrl';
import { normalizeDuelConfig, validateDuelConfig } from './duel.config';
import { pickCardsForDuel } from './duelCardPicker';
import { formatDuelResponse } from './formatDuelResponse';
import duelRaceService from './DuelRaceService';
import { logDuelLifecycle } from './duelLifecycleLog';
import { DuelConfig, DuelHeadToHeadStats, DuelHistoryEntry, DuelResponse } from './duel.types';

const DUEL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_CODE_ATTEMPTS = 12;

export class DuelService {
  constructor(
    private readonly duelRepository: DuelRepository,
    private readonly cardRepository: CardRepository,
    private readonly friendshipRepository: FriendshipRepository
  ) {}

  async createLobby(
    hostSub: string,
    deskSub: string,
    partialConfig?: Partial<DuelConfig>,
    inviteFriendSub?: string
  ): Promise<DuelResponse> {
    await this.assertDeskEligibleForDuel(hostSub, deskSub);

    if (inviteFriendSub) {
      if (inviteFriendSub === hostSub) {
        throw new BadRequestError('You cannot invite yourself to a duel');
      }

      const areFriends = await this.friendshipRepository.areAcceptedFriends(hostSub, inviteFriendSub);
      if (!areFriends) {
        throw new ForbiddenError('You can only invite accepted friends to a duel');
      }

      await this.duelRepository.cancelPendingDuelsBetweenPair(hostSub, inviteFriendSub);
    }

    const config = normalizeDuelConfig(deskSub, partialConfig);
    await this.assertDeskEligibleForDuel(hostSub, deskSub, config.cardCount);

    const duelId = uuidV4();
    const code = await this.generateUniqueCode();

    const duel = await this.duelRepository.insertDuel({
      id: duelId,
      code,
      hostSub,
      deskSub,
      config,
    });

    if (!duel) {
      throw new Error('Failed to create duel lobby');
    }

    await this.duelRepository.insertPlayer({
      duelId,
      userSub: hostSub,
      slot: 1,
      ready: false,
    });

    logDuelLifecycle('duel.created', {
      duelId,
      hostSub,
      deskSub,
      cardCount: config.cardCount,
      inviteFriendSub: inviteFriendSub ?? null,
    });

    return this.getLobbyState(duelId, hostSub);
  }

  async joinLobby(userSub: string, code: string): Promise<DuelResponse> {
    const duel = await this.duelRepository.getByCode(code.trim().toUpperCase());
    if (!duel) {
      throw new NotFoundError('Duel not found or invite has expired');
    }

    if (duel.status !== 'waiting') {
      throw new ConflictError('This duel is no longer accepting players');
    }

    if (duel.host_sub === userSub) {
      throw new BadRequestError('Host is already in this lobby');
    }

    const areFriends = await this.friendshipRepository.areAcceptedFriends(userSub, duel.host_sub);
    if (!areFriends) {
      throw new ForbiddenError('You can only join duels hosted by accepted friends');
    }

    const existingPlayer = await this.duelRepository.getPlayer(duel.id, userSub);
    if (existingPlayer) {
      return this.getLobbyState(duel.id, userSub);
    }

    const playerCount = await this.duelRepository.countPlayers(duel.id);
    if (playerCount >= 2) {
      throw new ConflictError('This duel lobby is already full');
    }

    try {
      await this.duelRepository.insertPlayer({
        duelId: duel.id,
        userSub,
        slot: 2,
        ready: false,
      });
    } catch (error) {
      const stillParticipant = await this.duelRepository.isParticipant(duel.id, userSub);
      if (stillParticipant) {
        return this.getLobbyState(duel.id, userSub);
      }

      const playerCountAfterRace = await this.duelRepository.countPlayers(duel.id);
      if (playerCountAfterRace >= 2) {
        throw new ConflictError('This duel lobby is already full');
      }

      throw error;
    }

    logDuelLifecycle('duel.joined', { duelId: duel.id, userSub, hostSub: duel.host_sub });

    return this.getLobbyState(duel.id, userSub);
  }

  async getLobbyState(duelId: string, viewerSub: string): Promise<DuelResponse> {
    const duel = await this.getDuelOrThrow(duelId);
    await this.assertParticipant(duelId, viewerSub);

    const players = await this.duelRepository.getPlayers(duelId);
    return formatDuelResponse(duel, players);
  }

  async setReady(userSub: string, duelId: string, ready: boolean): Promise<DuelResponse> {
    const duel = await this.getDuelOrThrow(duelId);
    this.assertLobbyMutable(duel.status);

    await this.assertParticipant(duelId, userSub);
    await this.duelRepository.updatePlayerReady(duelId, userSub, ready);

    return this.getLobbyState(duelId, userSub);
  }

  async updateConfig(hostSub: string, duelId: string, partialConfig: Partial<DuelConfig>): Promise<DuelResponse> {
    const duel = await this.getDuelOrThrow(duelId);

    if (duel.host_sub !== hostSub) {
      throw new ForbiddenError('Only the host can update duel config');
    }

    this.assertLobbyMutable(duel.status);

    const nextConfig = normalizeDuelConfig(duel.desk_sub, {
      ...duel.config,
      ...partialConfig,
      deskSub: duel.desk_sub,
    });

    await this.assertDeskEligibleForDuel(hostSub, duel.desk_sub, nextConfig.cardCount);
    await this.duelRepository.updateConfig(duelId, nextConfig);

    return this.getLobbyState(duelId, hostSub);
  }

  async leaveLobby(
    userSub: string,
    duelId: string,
    options?: { intentional?: boolean }
  ): Promise<DuelResponse> {
    const duel = await this.getDuelOrThrow(duelId);
    await this.assertParticipant(duelId, userSub);

    if (duel.status === 'racing' || duel.status === 'finished') {
      throw new ConflictError('Cannot leave duel after it has started');
    }

    if (duel.status === 'countdown' && !options?.intentional) {
      throw new ConflictError('Cannot leave during countdown');
    }

    if (duel.host_sub === userSub) {
      await this.duelRepository.cancelDuel(duelId);
      logDuelLifecycle('duel.cancelled', { duelId, userSub, reason: 'host_left' });
    } else {
      await this.duelRepository.removePlayer(duelId, userSub);
      logDuelLifecycle('duel.left', { duelId, userSub, reason: 'guest_left' });
    }

    return this.getLobbySnapshot(duelId);
  }

  async cancelActiveDuelsForDesk(deskSub: string): Promise<void> {
    await this.duelRepository.cancelDuelsByDesk(deskSub);
    logDuelLifecycle('duel.desk_cancelled', { deskSub });
  }

  async pickCardsForDuel(
    deskSub: string,
    cardCount: number,
    cardPick: DuelConfig['cardPick'],
    seed: number
  ): Promise<string[]> {
    const rows = await this.duelRepository.getCardSubsByDesk(deskSub);
    const allCardSubs = rows.map((row) => row.sub);

    return pickCardsForDuel({
      allCardSubs,
      cardCount,
      cardPick,
      seed,
    });
  }

  async assignCardsToDuel(duelId: string, seed: number): Promise<string[]> {
    const duel = await this.getDuelOrThrow(duelId);
    const cardSubs = await this.pickCardsForDuel(
      duel.desk_sub,
      duel.config.cardCount,
      duel.config.cardPick,
      seed
    );

    await this.duelRepository.updateCards(duelId, seed, cardSubs);
    return cardSubs;
  }

  async getHeadToHeadStats(userSub: string, friendSub: string): Promise<DuelHeadToHeadStats> {
    const areFriends = await this.friendshipRepository.areAcceptedFriends(userSub, friendSub);
    if (!areFriends) {
      throw new ForbiddenError('Head-to-head stats are available for accepted friends only');
    }

    const outcomes = await this.duelRepository.getHeadToHeadOutcomes(userSub, friendSub);
    const wins = outcomes.filter((row) => row.placement === 1).length;
    const losses = outcomes.length - wins;

    return {
      wins,
      losses,
      totalDuels: outcomes.length,
    };
  }

  async getHistory(userSub: string, limit = 20): Promise<DuelHistoryEntry[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 50);
    const rows = await this.duelRepository.getHistoryForUser(userSub, cappedLimit);

    return rows.map((row) => {
      const cardCount = row.config.cardCount;
      const myAnswers = row.my_answers ?? [];
      const opponentAnswers = row.opponent_answers ?? [];
      const myFinished = myAnswers.length >= cardCount;
      const opponentFinished = opponentAnswers.length >= cardCount;

      let outcome: DuelHistoryEntry['outcome'] = 'loss';
      if (row.my_placement === row.opponent_placement) {
        outcome = 'tie';
      } else if (row.my_placement === 1 && !opponentFinished) {
        outcome = 'forfeit_win';
      } else if (row.opponent_placement === 1 && !myFinished) {
        outcome = 'forfeit_loss';
      } else if (row.my_placement === 1) {
        outcome = 'win';
      }

      const opponent =
        row.opponent_sub && row.opponent_placement !== null && row.opponent_score !== null
          ? mapAvatarUrl({
              sub: row.opponent_sub,
              nickname: row.opponent_nickname ?? 'User',
              avatar_key: row.opponent_avatar_key ?? null,
            })
          : null;

      return {
        id: row.id,
        deskSub: row.desk_sub,
        deskTitle: row.desk_title,
        finishedAt: row.finished_at,
        cardCount,
        myPlacement: row.my_placement,
        myScore: row.my_score,
        opponent: opponent
          ? {
              sub: row.opponent_sub!,
              nickname: opponent.nickname,
              avatar_url: opponent.avatar_url,
              placement: row.opponent_placement!,
              score: row.opponent_score!,
            }
          : null,
        outcome,
      };
    });
  }

  async markDisconnected(userSub: string, duelId: string): Promise<void> {
    await this.assertParticipant(duelId, userSub);
    await this.duelRepository.markPlayerDisconnected(duelId, userSub);
  }

  async clearDisconnected(userSub: string, duelId: string): Promise<void> {
    await this.assertParticipant(duelId, userSub);
    await this.duelRepository.clearPlayerDisconnected(duelId, userSub);
  }

  async isParticipant(duelId: string, userSub: string): Promise<boolean> {
    return this.duelRepository.isParticipant(duelId, userSub);
  }

  async getLobbySnapshot(duelId: string): Promise<DuelResponse> {
    const duel = await this.getDuelOrThrow(duelId);
    const players = await this.duelRepository.getPlayers(duelId);
    return formatDuelResponse(duel, players);
  }

  async startLobby(hostSub: string, duelId: string): Promise<DuelResponse> {
    const duel = await this.getDuelOrThrow(duelId);

    if (duel.host_sub !== hostSub) {
      throw new ForbiddenError('Only the host can start the duel');
    }

    if (duel.status !== 'waiting') {
      throw new ConflictError('Duel can only be started from waiting status');
    }

    const players = await this.duelRepository.getPlayers(duelId);
    if (players.length < 2) {
      throw new BadRequestError('Duel requires two players');
    }

    if (!players.every((player) => player.ready)) {
      throw new BadRequestError('All players must be ready');
    }

    await this.assertDeskEligibleForDuel(hostSub, duel.desk_sub, duel.config.cardCount);

    const seed = Date.now();
    await this.assignCardsToDuel(duelId, seed);
    await this.duelRepository.beginCountdown(duelId);

    logDuelLifecycle('duel.started', {
      duelId,
      hostSub,
      deskSub: duel.desk_sub,
      cardCount: duel.config.cardCount,
    });

    return this.getLobbySnapshot(duelId);
  }

  async transitionToRacing(duelId: string): Promise<DuelResponse | null> {
    const duel = await this.getDuelOrThrow(duelId);
    if (duel.status !== 'countdown') {
      return null;
    }

    const players = await this.duelRepository.getPlayers(duelId);
    if (players.length < 2) {
      await this.duelRepository.cancelDuel(duelId);
      logDuelLifecycle('duel.cancelled', { duelId, reason: 'insufficient_players_at_start' });
      return this.getLobbySnapshot(duelId);
    }

    await this.duelRepository.setDuelStarted(duelId);
    logDuelLifecycle('duel.racing', { duelId, playerCount: players.length });
    return this.getLobbySnapshot(duelId);
  }

  async handleDisconnectGraceExpired(userSub: string, duelId: string): Promise<void> {
    const player = await this.duelRepository.getPlayer(duelId, userSub);
    if (!player?.disconnected_at) {
      return;
    }

    const duel = await this.getDuelOrThrow(duelId);

    if (duel.status === 'racing') {
      await duelRaceService.forfeitDueToDisconnect(duelId, userSub);
      return;
    }

    if (duel.status !== 'waiting' && duel.status !== 'countdown') {
      return;
    }

    if (duel.host_sub === userSub) {
      await this.duelRepository.cancelDuel(duelId);
      logDuelLifecycle('duel.cancelled', { duelId, userSub, reason: 'host_disconnect' });
      return;
    }

    await this.duelRepository.removePlayer(duelId, userSub);
    logDuelLifecycle('duel.left', { duelId, userSub, reason: 'guest_disconnect' });
  }

  private async assertDeskEligibleForDuel(
    userSub: string,
    deskSub: string,
    cardCount?: number
  ) {
    await this.assertDeskAccess(userSub, deskSub);

    const isActive = await this.duelRepository.isDeskActive(deskSub);
    if (!isActive) {
      throw new ConflictError('This desk is archived and cannot be used for duels');
    }

    if (cardCount !== undefined) {
      await this.assertDeskHasEnoughCards(deskSub, cardCount);
    }
  }

  private async assertDeskAccess(userSub: string, deskSub: string) {
    const hasAccess = await this.cardRepository.haveAccessToDesk({
      user_sub: userSub,
      desk_sub: deskSub,
    });

    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this desk');
    }
  }

  private async assertDeskHasEnoughCards(deskSub: string, cardCount: number) {
    const totalCards = await this.duelRepository.countCardsByDesk(deskSub);
    if (totalCards < cardCount) {
      throw new BadRequestError(
        `Desk has only ${totalCards} cards, but duel requires ${cardCount}`
      );
    }
  }

  private async getDuelOrThrow(duelId: string) {
    const duel = await this.duelRepository.getById(duelId);
    if (!duel) {
      throw new NotFoundError('Duel not found');
    }

    return duel;
  }

  private async assertParticipant(duelId: string, userSub: string) {
    const isParticipant = await this.duelRepository.isParticipant(duelId, userSub);
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this duel');
    }
  }

  private assertLobbyMutable(status: string) {
    if (status !== 'waiting') {
      throw new ConflictError('Duel lobby can no longer be changed');
    }
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = this.randomCode();
      const exists = await this.duelRepository.existsCode(code);
      if (!exists) {
        return code;
      }
    }

    throw new Error('Failed to generate unique duel code');
  }

  private randomCode(length = 6): string {
    let code = '';
    for (let index = 0; index < length; index += 1) {
      const charIndex = Math.floor(Math.random() * DUEL_CODE_ALPHABET.length);
      code += DUEL_CODE_ALPHABET[charIndex];
    }
    return code;
  }
}

export { validateDuelConfig };

export default new DuelService(duelRepository, cardRepository, friendshipRepository);
