import { BadRequestError } from '../../../exceptions';
import { DuelConfig } from './duel.types';

export const DUEL_CARD_COUNTS = [5, 10, 15, 20] as const;

export const DEFAULT_DUEL_CONFIG: Omit<DuelConfig, 'deskSub'> = {
  cardCount: 10,
  mode: 'write',
  cardSet: 'mirror',
  cardPick: 'random',
  countdownSec: 3,
  wrongAnswerLockMs: 1500,
  showLiveProgress: true,
};

export function normalizeDuelConfig(
  deskSub: string,
  partial?: Partial<DuelConfig>
): DuelConfig {
  const merged = {
    ...DEFAULT_DUEL_CONFIG,
    deskSub,
    ...partial,
  };

  validateDuelConfig(merged);
  return merged;
}

export function validateDuelConfig(config: DuelConfig): void {
  if (!config.deskSub || typeof config.deskSub !== 'string') {
    throw new BadRequestError('deskSub is required');
  }

  if (!DUEL_CARD_COUNTS.includes(config.cardCount)) {
    throw new BadRequestError('cardCount must be 5, 10, 15, or 20');
  }

  if (config.mode !== 'write') {
    throw new BadRequestError('mode must be write');
  }

  if (config.cardSet !== 'mirror') {
    throw new BadRequestError('cardSet must be mirror');
  }

  if (config.cardPick !== 'random' && config.cardPick !== 'newest') {
    throw new BadRequestError('cardPick must be random or newest');
  }

  if (config.countdownSec < 1 || config.countdownSec > 10) {
    throw new BadRequestError('countdownSec must be between 1 and 10');
  }

  if (config.wrongAnswerLockMs < 0 || config.wrongAnswerLockMs > 10_000) {
    throw new BadRequestError('wrongAnswerLockMs must be between 0 and 10000');
  }

  if (typeof config.showLiveProgress !== 'boolean') {
    throw new BadRequestError('showLiveProgress must be a boolean');
  }
}
