import gameSessionCardRepository, {
  GameSessionCardRepository,
} from '../../databases/postgre/entities/game/GameSessionCardRepository';
import gameSessionRepository, {
  GameSessionRepository,
} from '../../databases/postgre/entities/game/GameSessionRepository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../exceptions';
import cardService, { CardService } from '../cards/CardService';
import reviewService, { ReviewService } from '../reviews/ReviewService';
import { v4 as uuidV4 } from 'uuid';
import userService, { UserService } from '../users/UserService';

export class GameService {
  constructor(
    public gameSessionRepository: GameSessionRepository,
    public gameSessionCardRepository: GameSessionCardRepository,
    public cardService: CardService,
    public reviewService: ReviewService,
    public userService: UserService
  ) {}

  async startGameSession(userSub: string, deskSub: string): Promise<any> {
    const sessionId = uuidV4();

    const tx = await this.gameSessionCardRepository.startTransaction();

    try {
      await this.gameSessionRepository.create(sessionId, userSub, deskSub, tx);

      const deskSettings = await this.cardService.getDeskSettings(deskSub);
      if (!deskSettings) {
        throw new Error('Desk settings not found');
      }

      const { cards_per_session, card_orientation } = deskSettings;

      const cards = await this.cardService.getCardSubsForPlay(deskSub, cards_per_session);

      for (const c of cards) {
        const direction = this.resolveDirection(card_orientation);
        await this.gameSessionCardRepository.create(sessionId, c.sub, direction, tx);
      }

      await this.cardService.updateLastTimePlayedDesk(deskSub, tx);

      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

    return { sessionId };
  }

  async startReviewSession(userSub: string, batchId: string): Promise<any> {
    const batchCards = await this.reviewService.getBatchCardsForUser(batchId, userSub);
    if (batchCards.length === 0) {
      throw new Error('No cards in batch or batch already reviewed');
    }

    const sessionId = uuidV4();

    const tx = await this.gameSessionCardRepository.startTransaction();

    try {
      await this.gameSessionRepository.createReview(sessionId, userSub, batchId, tx);

      const cardSubs = await this.reviewService.getCardSubsByBatchId(batchId);

      for (const sub of cardSubs) {
        const direction = this.resolveDirection('normal');
        await this.gameSessionCardRepository.create(sessionId, sub, direction, tx);
      }

      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

    return { sessionId };
  }

  async getNextCard(userSub: string, sessionId: string): Promise<any> {
    const existSession = await this.gameSessionRepository.existBySessionId(sessionId);
    if (!existSession) {
      throw new NotFoundError(`Session not found by id = ${sessionId}`);
    }

    const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
    if (!haveAccess) {
      throw new NotFoundError(
        `User with sub = ${userSub} cannot get access to session with id = ${sessionId}`
      );
    }

    const card = await this.gameSessionCardRepository.getNextInSessionCard(sessionId);
    if (!card) {
      throw new BadRequestError(`Session with id = ${sessionId} is already completed`);
    }

    return card;
  }

  async answerCard(params: { sessionId: string; userSub: string; answer: string }) {
    const { sessionId, userSub, answer } = params;

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

    const isActive = await this.gameSessionRepository.isActive(sessionId);
    if (!isActive) {
      throw new BadRequestError(`Session with id = ${sessionId} is not active`);
    }

    const card = await this.gameSessionRepository.getNextUnansweredCard({
      sessionId,
      userSub,
    });

    if (!card) {
      throw new NotFoundError('No active card in session');
    }

    const { sessionCardId, direction, frontVariants, backVariants } = card;

    const correctVariants: string[] = direction === 'front_to_back' ? backVariants : frontVariants;

    const normalizedAnswer = this.normalize(answer);

    const isCorrect = correctVariants.some(
      (variant) => this.normalize(variant) === normalizedAnswer
    );

    await this.gameSessionRepository.saveAnswer({
      sessionCardId,
      answer,
      isCorrect,
    });

    if (isCorrect) {
      const userId = await this.userService.getProfileId(userSub);
      await this.userService.addCardInDaily(userId);
    }

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

  async gradeCard(params: { sessionId: string; userSub: string; quality: number }) {
    const { sessionId, userSub, quality } = params;

    const exist = await this.gameSessionRepository.existBySessionId(sessionId);
    if (!exist) throw new NotFoundError('Session not found');

    const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
    if (!haveAccess) throw new ForbiddenError('No access to session');

    const lastCard = await this.gameSessionCardRepository.getLastAnsweredCard(sessionId);
    if (!lastCard) throw new BadRequestError('No answered card to grade');

    await cardService.updateSrs(userSub, lastCard.cardSub, quality);
  }

  async finishGameSession(params: { sessionId: string; userSub: string }) {
    const { sessionId, userSub } = params;

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

    const isActive = await this.gameSessionRepository.isActive(sessionId);
    if (!isActive) {
      throw new BadRequestError(`Session with id = ${sessionId} is not active`);
    }

    await this.gameSessionRepository.finish(sessionId);
  }

  async startFeedSession(userSub: string): Promise<any> {
    const sessionId = uuidV4();

    await this.gameSessionRepository.createFeed(sessionId, userSub);

    return { sessionId };
  }

  async getFeedNextCard(userSub: string, sessionId: string) {
    const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
    if (!haveAccess) {
      throw new NotFoundError('No access to session');
    }

    const shownCardSubs = await this.getShownCardsInSession(userSub, sessionId);

    const userPreferences = await this.getUserTopicPreferences(userSub);

    const limit = shownCardSubs.length === 0 ? 2 : 1;

    const feedSettings = await this.cardService.getFeedSettingsByUserSub(userSub);

    const cards = await this.cardService.getCardForFeed({
      userSub,
      exclude: shownCardSubs,
      preferences: userPreferences,
      limit,
      sessionId,
      cardOrientation: feedSettings.card_orientation,
    });

    if (!cards || cards.length === 0) return null;

    for (const card of cards) {
      await this.gameSessionCardRepository.createWithoutTx(
        sessionId,
        card.sub,
        card.card_direction
      );
    }

    return {
      cards: cards.map((c) => ({
        sub: c.sub,
        text: c.front_variants,
        backVariants: c.back_variants,
        imageUuid: c.image_uuid,
        deskTitle: c.desk_title,
        deskSub: c.desk_sub,
        globalStats: {
          shown: c.global_shown_count,
          liked: c.global_like_count,
          answered: c.global_answer_count,
        },
        examples: c.examples,
      })),
    };
  }

  async cardShown(userSub: string, sessionId: string, cardSub: string) {
    const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
    if (!haveAccess) {
      throw new NotFoundError('No access to session');
    }

    await this.cardService.recordCardShown(userSub, cardSub);
  }

  async getShownCardsInSession(userSub: string, sessionId: string): Promise<string[]> {
    return this.cardService.getShownCardsForSession(userSub, sessionId);
  }

  async recordCardShownInSession(sessionId: string, cardSub: string): Promise<void> {
    return this.gameSessionRepository.recordCardShown(sessionId, cardSub);
  }

  async swipeCard(params: {
    userSub: string;
    sessionId: string;
    cardSub: string;
    action: 'like' | 'skip' | 'answer';
    deskSub?: string;
  }) {
    const { userSub, sessionId, cardSub, action, deskSub } = params;

    const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
    if (!haveAccess) {
      throw new ForbiddenError('No access to session');
    }

    await this.cardService.recordCardAction(userSub, cardSub, action);

    if (action === 'like') {
      await this.cardService.addCardToSrs(userSub, cardSub);
    }

    if (deskSub) {
      await this.cardService.addCardToDesk(userSub, cardSub, deskSub);
    }

    await this.gameSessionCardRepository.createFeedAction({
      sessionId,
      cardSub,
      action,
      deskSub,
    });
  }

  async addCardToDesk(userSub: string, cardSub: string, deskSubs: string[]) {
    const isOwner = await this.cardService.isDesksOwner(userSub, deskSubs);
    if (!isOwner) {
      throw new ForbiddenError('You are not the owner of desk/desks');
    }

    await this.cardService.cloneCardToDesks(cardSub, deskSubs);
  }

  private async getUserTopicPreferences(userSub: string) {
    const userDesks = await this.cardService.getUserDesks(userSub);
    const likedCards = await this.cardService.getLikedCards(userSub);

    const topics = new Set<string>();
    userDesks.forEach((desk) => {
      const words = desk.title.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 3) topics.add(word);
      });
    });

    const likedCardTopics = await this.cardService.analyzeCardTopics(likedCards);
    likedCardTopics.forEach((topic) => topics.add(topic));

    return Array.from(topics);
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private resolveDirection(deskOrientation: 'normal' | 'reversed' | 'mixed') {
    if (deskOrientation === 'normal') return 'front_to_back';
    if (deskOrientation === 'reversed') return 'back_to_front';

    return Math.random() < 0.5 ? 'front_to_back' : 'back_to_front';
  }
}

export default new GameService(
  gameSessionRepository,
  gameSessionCardRepository,
  cardService,
  reviewService,
  userService
);
