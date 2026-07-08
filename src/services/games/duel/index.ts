export type {
  DuelAnswerRecord,
  DuelConfig,
  DuelHeadToHeadStats,
  DuelMode,
  DuelCardPick,
  DuelCardSet,
  DuelPlayerResponse,
  DuelResponse,
  DuelStatus,
} from './duel.types';

export { DEFAULT_DUEL_CONFIG, DUEL_CARD_COUNTS, normalizeDuelConfig } from './duel.config';

export {
  applyAnswerToScoreState,
  calculateCorrectPoints,
  calculateTimePenalty,
  computeHeadToHeadStats,
  computePlacement,
  createInitialScoreState,
} from './duelScoring';

export { pickCardsForDuel } from './duelCardPicker';

export { formatDuelResponse } from './formatDuelResponse';

export type {
  DuelRaceCard,
  DuelRaceFinishedResults,
  DuelRaceOpponent,
  DuelRacePayload,
  DuelRaceProgress,
  DuelRaceRejoinState,
} from './duel.types';
