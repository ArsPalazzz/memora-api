import gameSessionCardRepository, {
  GameSessionCardRepository,
} from '../../databases/postgre/entities/game/GameSessionCardRepository';
import gameSessionRepository, {
  GameSessionRepository,
} from '../../databases/postgre/entities/game/GameSessionRepository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../exceptions';
import cardService, { CardService } from '../cards/CardService';
import { v4 as uuidV4 } from 'uuid';

export class GameService {
  constructor(
    public gameSessionRepository: GameSessionRepository,
    public gameSessionCardRepository: GameSessionCardRepository,
    public cardService: CardService
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

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private resolveDirection(deskOrientation: 'normal' | 'reversed' | 'mixed') {
    if (deskOrientation === 'normal') return 'front_to_back';
    if (deskOrientation === 'reversed') return 'back_to_front';

    return Math.random() < 0.5 ? 'front_to_back' : 'back_to_front';
  }
}

export default new GameService(gameSessionRepository, gameSessionCardRepository, cardService);
