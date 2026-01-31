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
import { Folder, FolderTree, GetDeskPayload } from './card.interfaces';
import { v4 as uuidV4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import cardExampleRepository, {
  CardExampleRepository,
} from '../../databases/postgre/entities/card/CardExampleRepository';
import gameSessionRepository, {
  GameSessionRepository,
} from '../../databases/postgre/entities/game/GameSessionRepository';
import userCardPreferencesRepository, {
  UserCardPreferencesRepository,
} from '../../databases/postgre/entities/game/UserCardPreferencesRepository';
import cardDiscoveryRepository, {
  CardDiscoveryRepository,
} from '../../databases/postgre/entities/game/CardDiscoveryRepository';
import cardPreferenceRepository, {
  CardPreferenceRepository,
} from '../../databases/postgre/entities/card/CardPreferenceRepository';
import feedSettingsRepository, {
  FeedSettingsRepository,
} from '../../databases/postgre/entities/card/FeedSettingsRepository';
import reviewSettingsRepository, {
  ReviewSettingsRepository,
} from '../../databases/postgre/entities/card/ReviewSettingsRepository';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class CardService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly cardExampleRepository: CardExampleRepository,
    private readonly deskSettingsRepository: DeskSettingsRepository,
    private readonly feedSettingsRepository: FeedSettingsRepository,
    private readonly reviewSettingsRepository: ReviewSettingsRepository,
    private readonly userCardSrsRepository: UserCardSrsRepository,
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly userCardPreferencesRepository: UserCardPreferencesRepository,
    private readonly cardDiscoveryRepository: CardDiscoveryRepository,
    private readonly cardPreferenceRepository: CardPreferenceRepository
  ) {}

  async getAllCards(): Promise<any> {
    return await this.cardRepository.getCards();
  }

  async recordCardShown(userSub: string, cardSub: string): Promise<void> {
    const exists = await this.cardPreferenceRepository.checkIfRecordExists(userSub, cardSub);

    if (exists) {
      await this.cardPreferenceRepository.updateAction({ userSub, cardSub, action: 'shown' });
    } else {
      await this.cardPreferenceRepository.insertAction({ userSub, cardSub, action: 'shown' });
    }
  }

  async getShownCardsForSession(userSub: string, sessionId: string): Promise<string[]> {
    const res = await this.cardPreferenceRepository.getShownCardsForSession(userSub, sessionId);
    return res.map((item) => item.card_sub);
  }

  async getCardForFeed(params: {
    userSub: string;
    exclude: string[];
    preferences: string[];
    limit: number;
    sessionId: string;
    cardOrientation: CARD_ORIENTATION;
  }) {
    const { userSub, exclude, preferences, limit, sessionId, cardOrientation } = params;

    const searchQuery = preferences.length > 0 ? preferences.join(' | ') : '';

    return this.cardDiscoveryRepository.getCardForFeed({
      userSub,
      exclude,
      searchQuery,
      limit,
      sessionId,
      cardOrientation,
    });
  }

  async recordCardAction(userSub: string, cardSub: string, action: 'like' | 'skip' | 'answer') {
    const actionType = action === 'like' ? 'liked' : action === 'answer' ? 'answered' : 'shown';

    if (action === 'like') {
      await this.cardDiscoveryRepository.updateCardStatsLikeCount(cardSub);
    } else if (action === 'answer') {
      await this.cardDiscoveryRepository.updateCardStatsAnswerCount(cardSub);
    }

    await this.userCardPreferencesRepository.recordCardAction(userSub, cardSub, actionType);
  }

  async addCardToSrs(userSub: string, cardSub: string) {
    await this.userCardSrsRepository.createOrUpdate({
      userSub,
      cardSub,
      repetitions: 0,
      intervalMinutes: 0,
      easeFactor: 2.5,
      nextReview: new Date(),
    });
  }

  async getFeedSettingsByUserSub(userSub: string) {
    const res = await this.feedSettingsRepository.getByUserSub(userSub);
    if (!res) {
      throw new Error(`Feed settings for user ${userSub} not found`);
    }

    return res;
  }

  async getReviewSettingsByUserSub(userSub: string) {
    const res = await this.reviewSettingsRepository.getByUserSub(userSub);
    if (!res) {
      throw new Error(`Review settings for user ${userSub} not found`);
    }

    return res;
  }

  async addCardToDesk(userSub: string, cardSub: string, targetDeskSub: string) {
    const isOwner = await this.cardRepository.isDeskOwner(userSub, targetDeskSub);
    if (!isOwner) {
      throw new ForbiddenError('You are not the owner of this desk');
    }

    await this.cloneCardToDesk(cardSub, targetDeskSub);
  }

  async cloneCardToDesk(cardSub: string, targetDeskSub: string) {
    const originalCard = await this.cardRepository.getCardBySub(cardSub);
    if (!originalCard) {
      throw new NotFoundError('Card not found');
    }

    const newCardSub = uuidV4();
    await this.cardRepository.create({
      sub: newCardSub,
      deskSub: targetDeskSub,
      frontVariants: originalCard.front_variants,
      backVariants: originalCard.back_variants,
      imageUuid: originalCard.image_uuid,
    });

    return newCardSub;
  }

  async cloneCardToDesks(cardSub: string, deskSubs: string[]) {
    const originalCard = await this.cardRepository.getCardBySub(cardSub);
    if (!originalCard) {
      throw new NotFoundError('Card not found');
    }

    for (const sub of deskSubs) {
      const newCardSub = uuidV4();
      await this.cardRepository.create({
        sub: newCardSub,
        deskSub: sub,
        frontVariants: originalCard.front_variants,
        backVariants: originalCard.back_variants,
        imageUuid: originalCard.image_uuid,
        copyOf: originalCard.id,
      });
    }
  }

  async isDeskOwner(userSub: string, deskSub: string) {
    return this.cardRepository.isDeskOwner(userSub, deskSub);
  }

  async isDesksOwner(userSub: string, deskSubs: string[]) {
    if (!deskSubs || deskSubs.length === 0) {
      return false;
    }

    try {
      const promises = deskSubs.map((deskSub) => this.isDeskOwner(userSub, deskSub));
      const results = await Promise.all(promises);

      return results.every((exists) => exists);
    } catch (error) {
      console.error('Error checking desk ownership:', error);
      return false;
    }
  }

  async getLikedCards(userSub: string) {
    return this.userCardPreferencesRepository.getLikedCards(userSub);
  }

  async analyzeCardTopics(cardSubs: string[]) {
    return this.cardDiscoveryRepository.analyzeCardTopics(cardSubs);
  }

  async getUserDesks(userSub: string) {
    return this.cardRepository.getUserDesks(userSub);
  }

  async getUserTopicPreferences(userSub: string) {
    const userDesks = await this.getUserDesks(userSub);
    const likedCards = await this.getLikedCards(userSub);

    const topics = new Set<string>();
    userDesks.forEach((desk) => {
      const words = desk.title.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 3) topics.add(word);
      });
    });

    const likedCardTopics = await this.analyzeCardTopics(likedCards);
    likedCardTopics.forEach((topic) => topics.add(topic));

    return Array.from(topics);
  }

  async createFeedSettings(userSub: string) {
    const exist = await this.feedSettingsRepository.existByUserSub(userSub);
    if (exist) {
      throw new Error(`Feed settings already exist for user with sub = ${userSub}`);
    }

    await this.feedSettingsRepository.create(userSub);
  }

  async createReviewSettings(userSub: string) {
    const exist = await this.reviewSettingsRepository.existByUserSub(userSub);
    if (exist) {
      throw new Error(`Review settings already exist for user with sub = ${userSub}`);
    }

    await this.reviewSettingsRepository.create(userSub);
  }

  async getDeskSettings(deskSub: string) {
    return await this.deskSettingsRepository.getByDeskSub(deskSub);
  }

  async updateLastTimePlayedDesk(deskSub: string, tx: PgTransaction) {
    await this.cardRepository.updateLastTimePlayedDesk(deskSub, tx);
  }

  async getUserDesksWithStats(userSub: string): Promise<
    {
      totalCards: number;
      newCards: number;
      dueCards: number;
      learningCards: number;
      masteredCards: number;
      sub: string;
      title: string;
      description: string;
    }[]
  > {
    return await this.cardRepository.getDesksByCreatorSub(userSub);
  }

  async getArchivedDesksWithStats(userSub: string): Promise<
    {
      totalCards: number;
      newCards: number;
      dueCards: number;
      learningCards: number;
      masteredCards: number;
      sub: string;
      title: string;
      description: string;
    }[]
  > {
    return await this.cardRepository.getArchivedDesksByCreatorSub(userSub);
  }

  async getUserDeskShort(userSub: string) {
    return await this.cardRepository.getDeskShortByCreatorSub(userSub);
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

    const deskInfo = await this.cardRepository.getDeskDetails({ deskSub: desk_sub, userSub: sub });
    if (!deskInfo) return;

    const { stats, cards, ...rest } = deskInfo;
    const limitedCards = cards.slice(0, 20);

    const weeklyStats = await this.gameSessionRepository.getWeeklyDeskStats(sub, desk_sub);
    if (!weeklyStats) return;

    return { ...rest, cards: limitedCards, stats: { ...stats, weeklyStats } };
  }

  async getCardsDesk(payload: GetDeskPayload) {
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

    return await this.cardRepository.getDeskCards({ deskSub: desk_sub });
  }

  async createCard(payload: { front: string[]; back: string[]; desk_sub: string }) {
    const deskExist = await this.cardRepository.existDesk({ sub: payload.desk_sub });
    if (!deskExist) {
      throw new NotFoundError(`CardService: desk with sub = ${payload.desk_sub} not found`);
    }

    const sub = uuidV4();
    await this.cardRepository.createCard({ sub, ...payload });

    this.generateExamples(sub, payload.front, payload.back);

    return sub;
  }

  async createDesk(payload: {
    sub: string;
    title: string;
    description: string;
    public: boolean;
    creatorSub: string;
    folderSub: string | null;
  }) {
    const { folderSub, ...rest } = payload;

    if (folderSub) {
      const exist = await this.cardRepository.existFolderBySub(folderSub);
      if (!exist) {
        throw new NotFoundError(`Folder with sub = ${folderSub} not found`);
      }
    }

    let existWithThisTitle: boolean | undefined = true;

    if (payload.folderSub) {
      existWithThisTitle = await this.cardRepository.existDeskWithTitleAndFolder({
        title: payload.title,
        folderSub: payload.folderSub,
        creatorSub: payload.creatorSub,
      });
    } else {
      existWithThisTitle = await this.cardRepository.existDeskWithTitle({
        title: payload.title,
        creatorSub: payload.creatorSub,
      });
    }

    if (existWithThisTitle) {
      throw new Error(`Desk with title = ${payload.title} is already exist`);
    }

    const created_at = await this.cardRepository.createDesk(rest);

    if (folderSub) {
      await this.cardRepository.addDeskToFolder(payload.sub, folderSub);
    }

    return {
      sub: payload.sub,
      title: payload.title,
      description: payload.description,
      public: payload.public,
      created_at,
    };
  }

  async createFolder(payload: {
    title: string;
    description: string;
    parentFolderSub: string | null;
    creatorSub: string;
  }) {
    const sub = uuidv4();

    let existWithThisTitle: boolean | undefined = true;

    if (payload.parentFolderSub) {
      existWithThisTitle = await this.cardRepository.existFolderWithTitleAndParent({
        title: payload.title,
        folderSub: payload.parentFolderSub,
        creatorSub: payload.creatorSub,
      });
    } else {
      existWithThisTitle = await this.cardRepository.existFolderWithTitle({
        title: payload.title,
        creatorSub: payload.creatorSub,
      });
    }

    if (existWithThisTitle) {
      throw new Error(`Folder with title = ${payload.title} is already exist`);
    }

    if (!payload.parentFolderSub) {
      return await this.cardRepository.createFolder({ sub, ...payload });
    }

    const exists = await this.cardRepository.existFolderBySub(payload.parentFolderSub);
    if (!exists) {
      throw new Error(`Folder with sub = ${payload.parentFolderSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToFolder(
      payload.parentFolderSub,
      payload.creatorSub
    );
    if (!haveAccess) {
      throw new Error(
        `User with sub = ${payload.creatorSub} don't have access to folder with sub = ${payload.parentFolderSub}`
      );
    }

    await this.cardRepository.createFolder({ sub, ...payload });
  }

  async getRootFolders(creatorSub: string) {
    return await this.cardRepository.getRootFolders(creatorSub);
  }

  async getFolderContents(folderSub: string, creatorSub: string) {
    return await this.cardRepository.getFolderContents(folderSub, creatorSub);
  }

  async getFolderInfo(folderSub: string) {
    return await this.cardRepository.getFolderInfo(folderSub);
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

  async updateFeedSettings(payload: { cardOrientation: CARD_ORIENTATION; creatorSub: string }) {
    const { cardOrientation, creatorSub } = payload;
    const exist = await this.feedSettingsRepository.existByUserSub(creatorSub);
    if (!exist) {
      throw new NotFoundError(
        `CardService: feed settings for user with sub = ${creatorSub} not found`
      );
    }

    await this.cardRepository.updateFeedCardOrientation({
      userSub: creatorSub,
      cardOrientation,
    });
  }

  async getCard(payload: { cardSub: string; creatorSub: string }) {
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
        `CardService: user with sub = ${creatorSub} cannot update card with sub = ${cardSub}`
      );
    }

    const res = await this.cardRepository.getCard(cardSub);
    if (!res) {
      throw new NotFoundError(`CardService: card with sub = ${cardSub} not found`);
    }

    return res;
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

  async getUsersWithDueCards() {
    return await this.userCardSrsRepository.getUsersWithDueCards();
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

  async restoreDesk(payload: { deskSub: string; creatorSub: string }) {
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
        `CardService: user with sub = ${creatorSub} don't have access to desk with sub = ${deskSub}`
      );
    }

    await this.cardRepository.restoreDesk({ desk_sub: deskSub });
  }

  async updateSrs(userSub: string, cardSub: string, quality: number) {
    const prevSrs = await this.userCardSrsRepository.get(userSub, cardSub);

    const srs = this.calculateSrs(prevSrs, quality);

    await this.userCardSrsRepository.upsert({
      userSub,
      cardSub,
      repetitions: srs.repetitions,
      intervalMinutes: srs.interval_minutes,
      easeFactor: srs.ease_factor,
      nextReview: srs.next_review,
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

  async updateReviewSettings(payload: { body: { cards_per_session: number }; creatorSub: string }) {
    const { body, creatorSub } = payload;
    const exist = await this.reviewSettingsRepository.existByUserSub(creatorSub);
    if (!exist) {
      throw new NotFoundError(
        `CardService: review settings for user with sub = ${creatorSub} not found`
      );
    }

    await this.reviewSettingsRepository.updateReviewSettings({
      userSub: creatorSub,
      cards_per_session: body.cards_per_session,
    });
  }

  private calculateSrs(prev: any | null, quality: number) {
    let repetitions = prev?.repetitions ?? 0;
    let interval = prev?.interval_minutes ?? 0;
    let ease = Number(prev?.ease_factor || 2.0);

    if (quality < 3) {
      repetitions = 0;
      interval = 120;
    } else {
      repetitions += 1;

      if (repetitions === 1) {
        interval = 60;
      } else if (repetitions === 2) {
        interval = 120;
      } else if (repetitions === 3) {
        interval = 180;
      } else if (repetitions === 4) {
        interval = 360;
      } else if (repetitions === 5) {
        interval = 720;
      } else if (repetitions === 6) {
        interval = 1440;
      } else if (repetitions === 7) {
        interval = 2880;
      } else if (repetitions === 8) {
        interval = 4320;
      } else if (repetitions === 9) {
        interval = 7200;
      } else {
        interval = Math.round(interval * 1.2);
        interval = Math.min(interval, 14 * 24 * 60);
      }

      if (quality === 5) {
        ease += 0.01;
      } else if (quality === 4) {
        ease += 0.005;
      } else if (quality === 3) {
        ease -= 0.15;
      }

      ease = Math.max(1.3, Math.min(ease, 2.0));
    }

    const nextReview = new Date();
    nextReview.setMinutes(nextReview.getMinutes() + interval);

    return {
      repetitions,
      interval_minutes: interval,
      ease_factor: Number(ease.toFixed(2)),
      next_review: nextReview,
    };
  }

  private async generateExamples(cardSub: string, front: string[], back: string[]) {
    try {
      if (!front.length || !back.length) return;

      const isProd = process.env.NODE_ENV === 'production';

      const examples = isProd
        ? await this.generateExamplesWithGemini(front)
        : await this.getExamplesTemplates(front);

      if (examples.length > 0) {
        await this.cardExampleRepository.createMany({ cardSub, sentences: examples });
      } else {
        console.log('❌ No examples found from Gemini');
      }
    } catch (error) {
      console.error('💥 Error generating examples:', error);
    }
  }

  private async getExamplesTemplates(words: string[]): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    return [
      `First sentence with words: ${words.join(', ')}`,
      `Second sentence with words: ${words.join(', ')}`,
      `Third sentence with words: ${words.join(', ')}`,
      `Fourth sentence with words: ${words.join(', ')}`,
      `Fifth sentence with words: ${words.join(', ')}`,
    ];
  }

  private async generateExamplesWithGemini(words: string[]): Promise<string[]> {
    try {
      const wordsString = words.map((w) => `"${w}"`).join(', ');

      const prompt = `Generate 5 diverse example sentences that use the following words: ${wordsString}.

        Requirements:
        1. Each sentence should use ONE OR MORE of the given words
        2. Different sentences should use DIFFERENT words from the list
        3. Each word from the list should appear in at least one sentence
        4. Sentences should be 8-25 words each
        5. Use modern, natural English
        6. Cover different contexts and grammatical structures
        7. Ensure sentences are grammatically correct
        8. Make sentences interesting and informative

        Format: Return each sentence on a new line without numbers or bullets.
        
        Example for words ["house", "garden"]:
        The old house had a beautiful garden full of roses.
        We decided to paint the house and redesign the garden.
        Living in a big house with a small garden can be challenging.
        The house's garden attracts many birds and butterflies.
        They bought a new house specifically for its large garden.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = response.candidates[0].content.parts[0].text;

        return this.parseExamplesResponse(text, words);
      }

      return [];
    } catch (error) {
      console.error('❌ Gemini API error:', error);

      return [];
    }
  }

  private parseExamplesResponse(text: string, words: string[]): string[] {
    return text
      .split('\n')
      .map((line) =>
        line
          .replace(/^\d+[\.\)]\s*/, '') // Remove "1. ", "2) "
          .replace(/^[\-\*•]\s*/, '') // Remove "- ", "* ", "• "
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/^Here (are|is)\s+/i, '') // Remove "Here are..."
          .replace(/^Examples?:\s*/i, '') // Remove "Examples:"
          .replace(/^For the words? .*:\s*/i, '') // Remove "For the words..."
          .trim()
      )
      .filter((line) => {
        // Basic validation
        if (line.length < 10 || line.length > 200) return false;
        if (!line.endsWith('.') && !line.endsWith('!') && !line.endsWith('?')) return false;
        if (line.startsWith('Sure') || line.startsWith('Of course') || line.startsWith('The words'))
          return false;

        // Check if line contains at least one of our words
        const lowerLine = line.toLowerCase();
        return words.some((word) => lowerLine.includes(word.toLowerCase()));
      })
      .slice(0, 10);
  }
}

export default new CardService(
  cardRepository,
  cardExampleRepository,
  deskSettingsRepository,
  feedSettingsRepository,
  reviewSettingsRepository,
  userCardSrsRepository,
  gameSessionRepository,
  userCardPreferencesRepository,
  cardDiscoveryRepository,
  cardPreferenceRepository
);
