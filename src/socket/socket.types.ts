import { Socket } from 'socket.io';
import {
  DuelRaceFinishedResults,
  DuelRacePayload,
  DuelRaceProgress,
  DuelRaceRejoinState,
} from '../services/games/duel/duel.types';

export interface SocketUserData {
  userSub: string;
  userRole: string;
  duelId?: string;
}

export interface DuelJoinPayload {
  duelId: string;
}

export interface DuelReadyPayload {
  duelId: string;
  ready: boolean;
}

export interface DuelUpdateConfigPayload {
  duelId: string;
  config: Record<string, unknown>;
}

export interface DuelStartPayload {
  duelId: string;
}

export interface DuelRaceAdvancePayload {
  duelId: string;
  cardIndex: number;
  answer: string;
  durationMs: number;
  clientTimestamp?: number;
}

export interface DuelRaceForfeitPayload {
  duelId: string;
}

export interface DuelRaceRejoinPayload {
  duelId: string;
}

export interface DuelLeavePayload {
  duelId: string;
}

export interface DuelRaceGradedPayload {
  cardIndex: number;
  correct: boolean;
}

export interface DuelClientToServerEvents {
  'lobby:join': (payload: DuelJoinPayload) => void;
  'lobby:leave': (payload: DuelLeavePayload) => void;
  'lobby:ready': (payload: DuelReadyPayload) => void;
  'lobby:update-config': (payload: DuelUpdateConfigPayload) => void;
  'lobby:start': (payload: DuelStartPayload) => void;
  'race:advance': (payload: DuelRaceAdvancePayload) => void;
  'race:forfeit': (payload: DuelRaceForfeitPayload) => void;
  'race:rejoin': (payload: DuelRaceRejoinPayload) => void;
}

export interface DuelServerToClientEvents {
  'lobby:state': (state: unknown) => void;
  'lobby:error': (payload: { message: string }) => void;
  'race:started': (payload: DuelRacePayload) => void;
  'race:progress': (payload: DuelRaceProgress) => void;
  'race:graded': (payload: DuelRaceGradedPayload) => void;
  'race:finished': (payload: { results: DuelRaceFinishedResults }) => void;
  'race:rejoin-state': (payload: DuelRaceRejoinState) => void;
  'race:error': (payload: { message: string }) => void;
}

export type SocketWithUser = Socket<
  DuelClientToServerEvents,
  DuelServerToClientEvents,
  Record<string, never>,
  SocketUserData
>;
