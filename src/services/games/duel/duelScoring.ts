import { DuelPlacementInput } from './duel.types';

export const DUEL_CORRECT_BASE_POINTS = 100;
export const DUEL_CORRECT_MIN_POINTS = 40;
export const DUEL_MAX_TIME_PENALTY = 60;
export const DUEL_STREAK_BONUS_THRESHOLD = 3;
export const DUEL_STREAK_MULTIPLIER = 1.1;

export function calculateTimePenalty(durationMs: number): number {
  return Math.min(DUEL_MAX_TIME_PENALTY, Math.floor(durationMs / 500) * 5);
}

export function calculateCorrectPoints(durationMs: number, streakAfterAnswer: number): number {
  const base = Math.max(DUEL_CORRECT_MIN_POINTS, DUEL_CORRECT_BASE_POINTS - calculateTimePenalty(durationMs));

  if (streakAfterAnswer >= DUEL_STREAK_BONUS_THRESHOLD) {
    return Math.floor(base * DUEL_STREAK_MULTIPLIER);
  }

  return base;
}

export function calculateWrongPoints(): number {
  return 0;
}

export interface DuelScoreState {
  score: number;
  correctCount: number;
  wrongCount: number;
  totalTimeMs: number;
  currentStreak: number;
  maxStreak: number;
}

export function createInitialScoreState(): DuelScoreState {
  return {
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    totalTimeMs: 0,
    currentStreak: 0,
    maxStreak: 0,
  };
}

export function applyAnswerToScoreState(
  state: DuelScoreState,
  params: { correct: boolean; durationMs: number }
): DuelScoreState {
  const totalTimeMs = state.totalTimeMs + Math.max(0, params.durationMs);

  if (!params.correct) {
    return {
      ...state,
      wrongCount: state.wrongCount + 1,
      totalTimeMs,
      currentStreak: 0,
    };
  }

  const currentStreak = state.currentStreak + 1;
  const points = calculateCorrectPoints(params.durationMs, currentStreak);

  return {
    score: state.score + points,
    correctCount: state.correctCount + 1,
    wrongCount: state.wrongCount,
    totalTimeMs,
    currentStreak,
    maxStreak: Math.max(state.maxStreak, currentStreak),
  };
}

export interface DuelPlacementResult extends DuelPlacementInput {
  placement: number;
}

export function computePlacement(players: DuelPlacementInput[]): DuelPlacementResult[] {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (a.totalTimeMs !== b.totalTimeMs) {
      return a.totalTimeMs - b.totalTimeMs;
    }

    if (b.correctCount !== a.correctCount) {
      return b.correctCount - a.correctCount;
    }

    return a.userSub.localeCompare(b.userSub);
  });

  let lastScore: number | null = null;
  let lastTime: number | null = null;
  let lastPlacement = 0;

  return sorted.map((player, index) => {
    const isTie =
      lastScore === player.score &&
      lastTime === player.totalTimeMs;

    const placement = isTie ? lastPlacement : index + 1;
    lastScore = player.score;
    lastTime = player.totalTimeMs;
    lastPlacement = placement;

    return {
      ...player,
      placement,
    };
  });
}

export interface DuelOutcomeRecord {
  userSub: string;
  opponentSub: string;
  placement: number;
}

export function computeHeadToHeadStats(
  outcomes: DuelOutcomeRecord[]
): Record<string, { wins: number; losses: number; totalDuels: number }> {
  const stats: Record<string, { wins: number; losses: number; totalDuels: number }> = {};

  const ensure = (userSub: string) => {
    if (!stats[userSub]) {
      stats[userSub] = { wins: 0, losses: 0, totalDuels: 0 };
    }
  };

  for (const outcome of outcomes) {
    ensure(outcome.userSub);

    stats[outcome.userSub].totalDuels += 1;

    if (outcome.placement === 1) {
      stats[outcome.userSub].wins += 1;
    } else {
      stats[outcome.userSub].losses += 1;
    }
  }

  return stats;
}
