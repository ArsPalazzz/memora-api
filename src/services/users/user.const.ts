export enum UserRole {
  REGISTERED = 'registered',
  ADMIN = 'admin',
}

export const MIN_CARDS_DAILY = 20;
export const MAX_CARDS_DAILY = 200;
export const GOAL_ADJUSTMENT_STEP = 5;

export const GET_CARD_NUMBER_BY_DAY = (day: number) => 20 + (day - 1) * GOAL_ADJUSTMENT_STEP;
