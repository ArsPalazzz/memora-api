export interface AnswerCardResult {
  isCorrect: boolean;
  finished: boolean;
  correctVariants: string[];
}

export interface RevealCardResult {
  finished: boolean;
  answerVariants: string[];
  examples: string[];
  frontVariants: string[];
}

export interface MatchBoardCard {
  sub: string;
  front: string[];
  backVariants: string[];
}

export interface MatchBoardRightSlot {
  slotId: number;
  text: string;
}

export interface MatchBoardResult {
  sessionId: string;
  cards: MatchBoardCard[];
  rightSlots: MatchBoardRightSlot[];
  progress: { total: number };
  submitted: boolean;
  results?: MatchCardResult[];
}

export interface MatchCardResult {
  cardSub: string;
  isCorrect: boolean;
}

export interface MatchSubmitResult {
  sessionId: string;
  results: MatchCardResult[];
}

export interface RecordDailyProgressParams {
  userSub: string;
  isCorrect?: boolean;
  quality?: number;
}
