import { BadRequestError, ForbiddenError, NotFoundError } from '../../../exceptions';
import cardService, { CardService } from '../../cards/CardService';
import userService, { UserService } from '../../users/UserService';
import gameSessionRepository, {
  GameSessionRepository,
} from '../../../databases/postgre/entities/game/GameSessionRepository';
import gameSessionCardRepository, {
  GameSessionCardRepository,
} from '../../../databases/postgre/entities/game/GameSessionCardRepository';
import matchBoardRepository, {
  MatchBoardRepository,
  MatchSessionCardRow,
} from '../../../databases/postgre/entities/game/MatchBoardRepository';
import { StudyMode } from '../studyMode.const';
import { MatchBoardResult, MatchCardResult } from '../studyMode.types';
import { formatVariantsForSlot, shuffleArray } from '../match.utils';
import {
  GradeCardParams,
  GradeFeedCardParams,
  MatchBoardParams,
  MatchSubmitParams,
  StudyModeHandler,
} from './StudyModeHandler';

export class MatchModeHandler implements StudyModeHandler {
  readonly mode: StudyMode = 'match';

  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly gameSessionCardRepository: GameSessionCardRepository,
    private readonly matchBoardRepository: MatchBoardRepository,
    private readonly cardService: CardService,
    private readonly userService: UserService
  ) {}

  async handleAnswer(): Promise<never> {
    throw new BadRequestError('Match mode does not accept typed answers. Use POST /games/match-submit.');
  }

  async handleFeedAnswer(): Promise<never> {
    throw new BadRequestError('Match mode does not accept typed answers. Use POST /games/match-submit.');
  }

  async handleMatchBoard(params: MatchBoardParams): Promise<MatchBoardResult> {
    const { sessionId, userSub } = params;

    await this.assertSessionAccess(sessionId, userSub);

    const cards = await this.matchBoardRepository.getSessionCardsForMatch(sessionId, userSub);
    if (cards.length === 0) {
      throw new BadRequestError('No cards in match session');
    }

    await this.ensureBoardSlots(sessionId, cards);

    const slots = await this.matchBoardRepository.getBoardSlots(sessionId);
    const submitted = await this.matchBoardRepository.hasMatchSubmit(sessionId);

    const response: MatchBoardResult = {
      sessionId,
      cards: cards.map((card) => this.toBoardCard(card)),
      rightSlots: slots.map(({ slotId, slotText }) => ({ slotId, text: slotText })),
      progress: { total: cards.length },
      submitted,
    };

    if (submitted) {
      response.results = cards.map(({ cardSub, isCorrect }) => ({
        cardSub,
        isCorrect: isCorrect ?? false,
      }));
    }

    return response;
  }

  async handleMatchSubmit(params: MatchSubmitParams) {
    const { sessionId, userSub, pairs } = params;

    await this.assertActiveSession(sessionId, userSub);

    if (await this.matchBoardRepository.hasMatchSubmit(sessionId)) {
      throw new BadRequestError('Match already submitted');
    }

    const cards = await this.matchBoardRepository.getSessionCardsForMatch(sessionId, userSub);
    if (cards.length === 0) {
      throw new BadRequestError('No cards in match session');
    }

    await this.ensureBoardSlots(sessionId, cards);

    const slots = await this.matchBoardRepository.getBoardSlots(sessionId);
    const slotById = new Map(slots.map((slot) => [slot.slotId, slot]));
    const cardSubSet = new Set(cards.map((card) => card.cardSub));

    if (pairs.length !== cards.length) {
      throw new BadRequestError('All cards must be paired before submitting');
    }

    const usedLeft = new Set<string>();
    const usedRight = new Set<number>();
    const results: MatchCardResult[] = [];
    const cardSubs: string[] = [];
    const isCorrectFlags: boolean[] = [];
    const slotIds: number[] = [];

    for (const pair of pairs) {
      const { leftCardSub, rightSlotId } = pair;

      if (!cardSubSet.has(leftCardSub)) {
        throw new BadRequestError(`Unknown card sub in pair: ${leftCardSub}`);
      }

      if (usedLeft.has(leftCardSub)) {
        throw new BadRequestError(`Duplicate left card in pairs: ${leftCardSub}`);
      }

      if (!Number.isInteger(rightSlotId)) {
        throw new BadRequestError(`Invalid right slot id: ${rightSlotId}`);
      }

      const slot = slotById.get(rightSlotId);
      if (!slot) {
        throw new BadRequestError(`Unknown right slot id: ${rightSlotId}`);
      }

      if (usedRight.has(rightSlotId)) {
        throw new BadRequestError(`Duplicate right slot in pairs: ${rightSlotId}`);
      }

      usedLeft.add(leftCardSub);
      usedRight.add(rightSlotId);

      const isCorrect = slot.cardSub === leftCardSub;

      results.push({ cardSub: leftCardSub, isCorrect });
      cardSubs.push(leftCardSub);
      isCorrectFlags.push(isCorrect);
      slotIds.push(rightSlotId);
    }

    if (usedLeft.size !== cards.length) {
      throw new BadRequestError('All cards must be paired before submitting');
    }

    await this.matchBoardRepository.saveMatchResults({
      sessionId,
      cardSubs,
      isCorrectFlags,
      slotIds,
    });

    return { sessionId, results };
  }

  async handleGrade(params: GradeCardParams): Promise<void> {
    const { sessionId, userSub, quality, cardSub } = params;

    await this.assertSessionAccess(sessionId, userSub);

    if (!cardSub) {
      throw new BadRequestError('cardSub is required for match mode grading');
    }

    const card = await this.matchBoardRepository.getMatchCardForGrade(sessionId, cardSub);
    if (!card) {
      throw new BadRequestError('Card is not available for grading');
    }

    await this.cardService.updateSrs(userSub, cardSub, quality);
    await this.matchBoardRepository.setMatchCardQuality(sessionId, cardSub, quality);
    await this.recordDailyProgress({ userSub, quality });

    const hasUngraded = await this.matchBoardRepository.hasUngradedMatchCards(sessionId);
    if (!hasUngraded) {
      await this.gameSessionRepository.finish(sessionId);
    }
  }

  async handleFeedGrade(params: GradeFeedCardParams): Promise<void> {
    return this.handleGrade(params);
  }

  async recordDailyProgress(params: { userSub: string; quality?: number }) {
    if (params.quality === undefined || params.quality < 3) return;

    const userId = await this.userService.getProfileId(params.userSub);
    await this.userService.addCardInDaily(userId);
  }

  private async ensureBoardSlots(sessionId: string, cards: MatchSessionCardRow[]) {
    const existing = await this.matchBoardRepository.getBoardSlots(sessionId);
    if (existing.length > 0) return;

    const slotEntries = cards.map((card) => ({
      cardSub: card.cardSub,
      slotText: this.getAnswerText(card),
    }));

    const shuffled = shuffleArray(slotEntries);

    for (let index = 0; index < shuffled.length; index++) {
      const entry = shuffled[index];

      try {
        await this.matchBoardRepository.insertBoardSlot({
          sessionId,
          slotId: index,
          cardSub: entry.cardSub,
          slotText: entry.slotText,
        });
      } catch {
        const slots = await this.matchBoardRepository.getBoardSlots(sessionId);
        if (slots.length > 0) return;
        throw new BadRequestError('Failed to initialize match board');
      }
    }
  }

  private toBoardCard(card: MatchSessionCardRow) {
    const isFrontToBack = card.direction === 'front_to_back';

    return {
      sub: card.cardSub,
      front: isFrontToBack ? card.frontVariants : card.backVariants,
      backVariants: isFrontToBack ? card.backVariants : card.frontVariants,
    };
  }

  private getAnswerText(card: MatchSessionCardRow) {
    const variants =
      card.direction === 'front_to_back' ? card.backVariants : card.frontVariants;

    return formatVariantsForSlot(variants);
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

export default new MatchModeHandler(
  gameSessionRepository,
  gameSessionCardRepository,
  matchBoardRepository,
  cardService,
  userService
);
