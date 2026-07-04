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
import { RevealCardResult } from '../studyMode.types';
import { RevealCardParams, RevealFeedCardParams, GradeCardParams, GradeFeedCardParams, StudyModeHandler } from './StudyModeHandler';

export class RevealModeHandler implements StudyModeHandler {
  readonly mode: StudyMode = 'reveal';

  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly gameSessionCardRepository: GameSessionCardRepository,
    private readonly cardService: CardService,
    private readonly userService: UserService
  ) {}

  async handleAnswer(): Promise<never> {
    throw new BadRequestError('Reveal mode does not accept typed answers. Use POST /games/reveal.');
  }

  async handleFeedAnswer(): Promise<never> {
    throw new BadRequestError('Reveal mode does not accept typed answers. Use POST /games/reveal.');
  }

  async handleReveal(params: RevealCardParams): Promise<RevealCardResult> {
    const { sessionId, userSub } = params;

    await this.assertActiveSession(sessionId, userSub);

    const card = await this.gameSessionRepository.getNextUnansweredCard({
      sessionId,
      userSub,
    });

    if (!card) {
      throw new NotFoundError('No active card in session');
    }

    const { sessionCardId, direction, frontVariants, backVariants, examples } = card;
    const answerVariants = direction === 'front_to_back' ? backVariants : frontVariants;

    await this.gameSessionRepository.saveReveal({ sessionCardId });

    const hasMore = await this.gameSessionRepository.hasUnansweredCards(sessionId);
    if (!hasMore) {
      await this.gameSessionRepository.finish(sessionId);
    }

    return {
      finished: !hasMore,
      answerVariants,
      examples: examples ?? [],
      frontVariants,
    };
  }

  async handleFeedReveal(params: RevealFeedCardParams): Promise<RevealCardResult> {
    const { sessionId, userSub, cardSub } = params;

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

    const { sessionCardId, direction, frontVariants, backVariants, examples } = card;
    const answerVariants = direction === 'front_to_back' ? backVariants : frontVariants;

    await this.gameSessionRepository.saveReveal({ sessionCardId });

    const hasMore = await this.gameSessionRepository.hasUnansweredCards(sessionId);
    if (!hasMore) {
      await this.gameSessionRepository.finish(sessionId);
    }

    return {
      finished: !hasMore,
      answerVariants,
      examples: examples ?? [],
      frontVariants,
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
    await this.recordDailyProgress({ userSub, quality });
  }

  async handleFeedGrade(params: GradeFeedCardParams): Promise<void> {
    const { sessionId, userSub, quality, cardSub } = params;

    await this.assertSessionAccess(sessionId, userSub);

    const card = await this.gameSessionCardRepository.getCardInSessionBySub(sessionId, cardSub);
    if (!card) {
      throw new BadRequestError('No answered card to grade');
    }

    await this.cardService.updateSrs(userSub, card.cardSub, quality);
    await this.recordDailyProgress({ userSub, quality });
  }

  async recordDailyProgress(params: { userSub: string; quality?: number }) {
    if (params.quality === undefined || params.quality < 3) return;

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

export default new RevealModeHandler(
  gameSessionRepository,
  gameSessionCardRepository,
  cardService,
  userService
);
