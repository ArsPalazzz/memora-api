import cardRepository, {
  CardRepository,
} from '../../databases/postgre/entities/card/CardRepository';
import deskSettingsRepository, {
  DeskSettingsRepository,
} from '../../databases/postgre/entities/card/DeskSettingsRepository';
import userCardSrsRepository, {
  UserCardSrsRepository,
} from '../../databases/postgre/entities/card/UserCardSrsRepository';
import { PgTransaction } from '../../databases/postgre/entities/Table';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../exceptions';
import { CARD_ORIENTATION, CARDS_PER_SESSION_LIMIT } from './card.const';
import { GetDeskPayload } from './card.interfaces';
import { v4 as uuidV4 } from 'uuid';

export class CardService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly deskSettingsRepository: DeskSettingsRepository,
    private readonly userCardSrsRepository: UserCardSrsRepository
  ) {}

  async getAllCards(): Promise<any> {
    return await this.cardRepository.getCards();
  }

  async getDeskSettings(deskSub: string) {
    return await this.deskSettingsRepository.getByDeskSub(deskSub);
  }

  async updateLastTimePlayedDesk(deskSub: string, tx: PgTransaction) {
    await this.cardRepository.updateLastTimePlayedDesk(deskSub, tx);
  }

  async getUserDesks(userSub: string): Promise<any> {
    return await this.cardRepository.getDesksByCreatorSub(userSub);
  }

  async getDesk(payload: GetDeskPayload): Promise<any> {
    const { desk_sub, sub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: desk_sub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${desk_sub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({ desk_sub, user_sub: sub });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${sub} doesn't have access to desk with id = ${desk_sub}`
      );
    }

    return await this.cardRepository.getDeskDetails({ sub: desk_sub });
  }

  async createCard(payload: { front: string[]; back: string[]; desk_sub: string }) {
    const deskExist = await this.cardRepository.existDesk({ sub: payload.desk_sub });
    if (!deskExist) {
      throw new NotFoundError(`CardService: desk with sub = ${payload.desk_sub} not found`);
    }

    const sub = uuidV4();
    return await this.cardRepository.createCard({ sub, ...payload });
  }

  async createDesk(payload: {
    sub: string;
    title: string;
    description: string;
    creatorSub: string;
  }) {
    const created_at = await this.cardRepository.createDesk(payload);

    return { sub: payload.sub, title: payload.title, description: payload.description, created_at };
  }

  async updateDesk(payload: {
    deskSub: string;
    body: { title: string; description: string };
    creatorSub: string;
  }) {
    const { deskSub, body, creatorSub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: deskSub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({
      user_sub: creatorSub,
      desk_sub: deskSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`
      );
    }

    await this.cardRepository.updateDesk({
      desk_sub: deskSub,
      payload: body,
    });
  }

  async updateCard(payload: {
    cardSub: string;
    body: { front: string[]; back: string[] };
    creatorSub: string;
  }) {
    const { cardSub, body, creatorSub } = payload;
    const exist = await this.cardRepository.existCardBySub({ sub: cardSub });
    if (!exist) {
      throw new NotFoundError(`CardService: card with sub = ${cardSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToCard({
      user_sub: creatorSub,
      card_sub: cardSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update card with sub = ${cardSub}`
      );
    }

    await this.cardRepository.updateCard({
      card_sub: cardSub,
      payload: body,
    });
  }

  async getCardSubsForPlay(deskSub: string, cardsPerSession: number) {
    return await this.cardRepository.getCardSubsForPlay(deskSub, cardsPerSession);
  }

  async deleteCard(payload: { cardSub: string; creatorSub: string }) {
    const { cardSub, creatorSub } = payload;
    const exist = await this.cardRepository.existCardBySub({ sub: cardSub });
    if (!exist) {
      throw new NotFoundError(`CardService: card with sub = ${cardSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToCard({
      user_sub: creatorSub,
      card_sub: cardSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot get access to card with sub = ${cardSub}`
      );
    }

    await this.cardRepository.deleteCard({ cardSub });
  }

  async archiveDesk(payload: { deskSub: string; creatorSub: string }) {
    const { deskSub, creatorSub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: deskSub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({
      user_sub: creatorSub,
      desk_sub: deskSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`
      );
    }

    await this.cardRepository.archiveDesk({ desk_sub: deskSub });
  }

  async updateSrs(userSub: string, cardSub: string, quality: number) {
    const prevSrs = await this.userCardSrsRepository.get(userSub, cardSub);

    const srs = this.calculateSrs(prevSrs, quality);

    await this.userCardSrsRepository.upsert({
      userSub,
      cardSub,
      repetitions: srs.repetitions,
      intervalDays: srs.interval,
      easeFactor: srs.ease,
      nextReview: srs.nextReview,
    });
  }

  async updateDeskSettings(payload: {
    deskSub: string;
    body: { cards_per_session: number; card_orientation: CARD_ORIENTATION };
    creatorSub: string;
  }) {
    const { deskSub, body, creatorSub } = payload;
    const exist = await this.cardRepository.existDesk({ sub: deskSub });
    if (!exist) {
      throw new NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToDesk({
      user_sub: creatorSub,
      desk_sub: deskSub,
    });
    if (!haveAccess) {
      throw new ForbiddenError(
        `CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`
      );
    }

    await this.cardRepository.updateDeskSettings({
      desk_sub: deskSub,
      payload: body,
    });
  }

  private calculateSrs(prev: any | null, quality: number) {
    let repetitions = prev?.repetitions ?? 0;
    let interval = prev?.interval_days ?? 0;
    let ease = prev?.ease_factor ?? 2.5;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;

      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * ease);

      ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return { repetitions, interval, ease, nextReview };
  }
}

export default new CardService(cardRepository, deskSettingsRepository, userCardSrsRepository);
