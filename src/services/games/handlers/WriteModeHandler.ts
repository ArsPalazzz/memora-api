import { BadRequestError, ForbiddenError, NotFoundError } from '../../../exceptions';
import cardService, { CardService } from '../../cards/CardService';
import userService, { UserService } from '../../users/UserService';
import gameSessionRepository, {
  GameSessionRepository,
} from '../../../databases/postgre/entities/game/GameSessionRepository';
import gameSessionCardRepository, {
  GameSessionCardRepository,
} from '../../../databases/postgre/entities/game/GameSessionCardRepository';
import { StudyMode } from '../studyMode.const';
import { AnswerCardResult } from '../studyMode.types';
import { checkAnswerCorrectness } from '../answer.utils';
import {
  AnswerCardParams,
  AnswerFeedCardParams,
  GradeCardParams,
  GradeFeedCardParams,
  StudyModeHandler,
} from './StudyModeHandler';

export class WriteModeHandler implements StudyModeHandler {
  readonly mode: StudyMode = 'write';

  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly gameSessionCardRepository: GameSessionCardRepository,
    private readonly cardService: CardService,
    private readonly userService: UserService
  ) {}

  async handleAnswer(params: AnswerCardParams): Promise<AnswerCardResult> {
    const { sessionId, userSub, answer } = params;

    await this.assertActiveSession(sessionId, userSub);

    const card = await this.gameSessionRepository.getNextUnansweredCard({
      sessionId,
      userSub,
    });

    if (!card) {
      throw new NotFoundError('No active card in session');
    }

    const { sessionCardId, direction, frontVariants, backVariants } = card;
    const correctVariants = direction === 'front_to_back' ? backVariants : frontVariants;
    const isCorrect = checkAnswerCorrectness(answer, correctVariants);

    await this.gameSessionRepository.saveAnswer({
      sessionCardId,
      answer,
      isCorrect,
    });

    await this.recordDailyProgress({ userSub, isCorrect });

    const hasMore = await this.gameSessionRepository.hasUnansweredCards(sessionId);
    if (!hasMore) {
      await this.gameSessionRepository.finish(sessionId);
    }

    return {
      isCorrect,
      finished: !hasMore,
      correctVariants,
    };
  }

  async handleFeedAnswer(params: AnswerFeedCardParams): Promise<AnswerCardResult> {
    const { sessionId, userSub, answer, cardSub } = params;

    await this.assertActiveSession(sessionId, userSub);

    const card = await this.gameSessionRepository.getCardInSessionBySub({
      sessionId,
      userSub,
      cardSub,
    });

    if (!card) {
      throw new NotFoundError(
        `Card with sub = ${cardSub} not found in session with id = ${sessionId}`
      );
    }

    const { sessionCardId, direction, frontVariants, backVariants } = card;
    const correctVariants = direction === 'front_to_back' ? backVariants : frontVariants;
    const isCorrect = checkAnswerCorrectness(answer, correctVariants);

    await this.gameSessionRepository.saveAnswer({
      sessionCardId,
      answer,
      isCorrect,
    });

    await this.recordDailyProgress({ userSub, isCorrect });

    const hasMore = await this.gameSessionRepository.hasUnansweredCards(sessionId);
    if (!hasMore) {
      await this.gameSessionRepository.finish(sessionId);
    }

    return {
      isCorrect,
      finished: !hasMore,
      correctVariants,
    };
  }

  async handleGrade(params: GradeCardParams): Promise<void> {
    const { sessionId, userSub, quality } = params;

    await this.assertSessionAccess(sessionId, userSub);

    const lastCard = await this.gameSessionCardRepository.getLastAnsweredCard(sessionId);
    if (!lastCard) {
      throw new BadRequestError('No answered card to grade');
    }

    await this.cardService.updateSrs(userSub, lastCard.cardSub, quality);
  }

  async handleFeedGrade(params: GradeFeedCardParams): Promise<void> {
    const { sessionId, userSub, quality, cardSub } = params;

    await this.assertSessionAccess(sessionId, userSub);

    const card = await this.gameSessionCardRepository.getCardInSessionBySub(sessionId, cardSub);
    if (!card) {
      throw new BadRequestError('No answered card to grade');
    }

    await this.cardService.updateSrs(userSub, card.cardSub, quality);
  }

  async recordDailyProgress(params: { userSub: string; isCorrect?: boolean; quality?: number }) {
    if (!params.isCorrect) return;

    const userId = await this.userService.getProfileId(params.userSub);
    await this.userService.addCardInDaily(userId);
  }

  private async assertActiveSession(sessionId: string, userSub: string) {
    await this.assertSessionAccess(sessionId, userSub);

    const isActive = await this.gameSessionRepository.isActive(sessionId);
    if (!isActive) {
      throw new BadRequestError(`Session with id = ${sessionId} is not active`);
    }
  }

  private async assertSessionAccess(sessionId: string, userSub: string) {
    const exist = await this.gameSessionRepository.existBySessionId(sessionId);
    if (!exist) {
      throw new NotFoundError(`Game session with id = ${sessionId} not found`);
    }

    const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
    if (!haveAccess) {
      throw new ForbiddenError(
        `User with sub = ${userSub} don't have access to game session with id = ${sessionId}`
      );
    }
  }
}

export default new WriteModeHandler(
  gameSessionRepository,
  gameSessionCardRepository,
  cardService,
  userService
);
