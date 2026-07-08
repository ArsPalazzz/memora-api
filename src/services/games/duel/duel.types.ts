export type DuelStatus = 'waiting' | 'countdown' | 'racing' | 'finished' | 'cancelled';

export type DuelCardPick = 'random' | 'newest';
export type DuelCardSet = 'mirror';
export type DuelMode = 'write';

export interface DuelConfig {
  deskSub: string;
  cardCount: 5 | 10 | 15 | 20;
  mode: DuelMode;
  cardSet: DuelCardSet;
  cardPick: DuelCardPick;
  countdownSec: number;
  wrongAnswerLockMs: number;
  showLiveProgress: boolean;
}

export interface DuelAnswerRecord {
  cardIndex: number;
  cardSub: string;
  answer: string;
  correct: boolean;
  durationMs: number;
}

export interface DuelPlayerRow {
  duel_id: string;
  user_sub: string;
  slot: number;
  ready: boolean;
  score: number;
  correct_count: number;
  wrong_count: number;
  total_time_ms: number;
  max_streak: number;
  answers: DuelAnswerRecord[];
  placement: number | null;
  disconnected_at: string | null;
  joined_at: string;
  nickname?: string;
  avatar_key?: string | null;
}

export interface DuelRow {
  id: string;
  code: string;
  host_sub: string;
  desk_sub: string;
  config: DuelConfig;
  card_seed: string | null;
  card_subs: string[] | null;
  status: DuelStatus;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  desk_title?: string;
  players?: DuelPlayerRow[];
}

export interface DuelPlayerResponse {
  sub: string;
  slot: number;
  ready: boolean;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalTimeMs: number;
  maxStreak: number;
  placement: number | null;
  disconnectedAt: string | null;
  joinedAt: string;
  nickname: string;
  avatar_url: string | null;
}

export interface DuelResponse {
  id: string;
  code: string;
  hostSub: string;
  deskSub: string;
  deskTitle: string;
  config: DuelConfig;
  cardSeed: number | null;
  cardSubs: string[];
  status: DuelStatus;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  players: DuelPlayerResponse[];
}

export interface DuelHeadToHeadStats {
  wins: number;
  losses: number;
  totalDuels: number;
}

export interface DuelPlacementInput {
  userSub: string;
  score: number;
  totalTimeMs: number;
  correctCount: number;
}

export interface DuelRaceOpponent {
  sub: string;
  nickname: string;
  avatar_url: string | null;
}

export interface DuelRaceCard {
  index: number;
  sub: string;
  text: string[];
  backVariants?: string[];
  image_url: string | null;
  promptLanguage: string;
  answerLanguage: string;
}

export interface DuelRacePayload {
  duelId: string;
  startedAt: number;
  config: DuelConfig;
  opponents: DuelRaceOpponent[];
  cards: DuelRaceCard[];
}

export interface DuelRaceProgress {
  userSub: string;
  cardIndex: number;
  score: number;
  correctCount: number;
  streak: number;
  totalTimeMs: number;
}

export interface DuelRaceOpponentProgress {
  sub: string;
  nickname: string;
  avatar_url: string | null;
  cardIndex: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  totalTimeMs: number;
  disconnectedAt: string | null;
}

export interface DuelRaceRejoinState {
  phase: 'countdown' | 'racing' | 'finished';
  duelId: string;
  myIndex: number;
  cardCount: number;
  myProgress: {
    score: number;
    correctCount: number;
    wrongCount: number;
    streak: number;
    totalTimeMs: number;
  };
  opponents: DuelRaceOpponentProgress[];
  payload?: DuelRacePayload;
  results?: DuelRaceFinishedResults;
}

export interface DuelRaceScoreboardEntry {
  sub: string;
  nickname: string;
  avatar_url: string | null;
  placement: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalTimeMs: number;
  maxStreak: number;
}

export interface DuelRaceCardComparison {
  cardIndex: number;
  cardSub: string;
  prompt: string[];
  players: Record<
    string,
    {
      answer: string;
      correct: boolean;
      durationMs: number;
    }
  >;
}

export interface DuelRaceFinishedResults {
  scoreboard: DuelRaceScoreboardEntry[];
  cardByCard: DuelRaceCardComparison[];
}

export interface DuelHistoryEntry {
  id: string;
  deskSub: string;
  deskTitle: string;
  finishedAt: string;
  cardCount: number;
  myPlacement: number;
  myScore: number;
  opponent: {
    sub: string;
    nickname: string;
    avatar_url: string | null;
    placement: number;
    score: number;
  } | null;
  outcome: 'win' | 'loss' | 'tie' | 'forfeit_win' | 'forfeit_loss';
}
