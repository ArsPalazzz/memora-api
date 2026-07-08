import { DuelAnswerRecord } from './duel.types';

export const DUEL_MIN_ANSWER_DURATION_MS = 200;
export const DUEL_RACE_RATE_LIMIT_MAX = 10;
export const DUEL_RACE_RATE_LIMIT_WINDOW_MS = 1000;

export function getExpectedCardIndex(answers: DuelAnswerRecord[]): number {
  return answers.length;
}

export function validateAdvanceRequest(params: {
  cardIndex: number;
  durationMs: number;
  expectedIndex: number;
}): { valid: true } | { valid: false; reason: string } {
  if (params.durationMs < DUEL_MIN_ANSWER_DURATION_MS) {
    return { valid: false, reason: 'Answer submitted too quickly' };
  }

  if (params.cardIndex !== params.expectedIndex) {
    return { valid: false, reason: 'Card index out of order' };
  }

  if (params.cardIndex < 0) {
    return { valid: false, reason: 'Invalid card index' };
  }

  return { valid: true };
}

export function isRaceComplete(answersCount: number, cardCount: number): boolean {
  return answersCount >= cardCount;
}
