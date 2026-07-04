import { StudyMode } from '../studyMode.const';
import {
  AnswerCardResult,
  MatchBoardResult,
  MatchSubmitResult,
  RecordDailyProgressParams,
  RevealCardResult,
} from '../studyMode.types';

export interface AnswerCardParams {
  sessionId: string;
  userSub: string;
  answer: string;
}

export interface AnswerFeedCardParams extends AnswerCardParams {
  cardSub: string;
}

export interface GradeCardParams {
  sessionId: string;
  userSub: string;
  quality: number;
  cardSub?: string;
}

export interface GradeFeedCardParams extends GradeCardParams {
  cardSub: string;
}

export interface RevealCardParams {
  sessionId: string;
  userSub: string;
}

export interface RevealFeedCardParams extends RevealCardParams {
  cardSub: string;
}

export interface MatchBoardParams {
  sessionId: string;
  userSub: string;
}

export interface MatchPair {
  leftCardSub: string;
  rightSlotId: number;
}

export interface MatchSubmitParams {
  sessionId: string;
  userSub: string;
  pairs: MatchPair[];
}

export interface StudyModeHandler {
  readonly mode: StudyMode;

  handleAnswer(params: AnswerCardParams): Promise<AnswerCardResult>;

  handleFeedAnswer(params: AnswerFeedCardParams): Promise<AnswerCardResult>;

  handleReveal?(params: RevealCardParams): Promise<RevealCardResult>;

  handleFeedReveal?(params: RevealFeedCardParams): Promise<RevealCardResult>;

  handleMatchBoard?(params: MatchBoardParams): Promise<MatchBoardResult>;

  handleMatchSubmit?(params: MatchSubmitParams): Promise<MatchSubmitResult>;

  handleGrade(params: GradeCardParams): Promise<void>;

  handleFeedGrade(params: GradeFeedCardParams): Promise<void>;

  recordDailyProgress(params: RecordDailyProgressParams): Promise<void>;
}
