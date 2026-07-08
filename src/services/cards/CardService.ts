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
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../exceptions';
import { CARD_ORIENTATION, CARDS_PER_SESSION_LIMIT, DEFAULT_BACK_LANGUAGE, DEFAULT_EXAMPLE_LANGUAGE, DEFAULT_FRONT_LANGUAGE, DESK_PREVIEW_CARD_LIMIT, DESK_VISIBILITY, DeskVisibility, INBOX_DESK_DESCRIPTION, INBOX_DESK_TITLE, canAddDeskToLibrary, canViewDeskVisibility, LANGUAGE_NAMES, LanguageCode, visibilityToLegacyPublic } from './card.const';
import { StudyMode, DEFAULT_DESK_STUDY_MODE } from '../games/studyMode.const';
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
import { mapCardImageUrl } from '../../utils/cardImageUrl';
import cardImageService from './CardImageService';
import cardPreferenceRepository, {
  CardPreferenceRepository,
} from '../../databases/postgre/entities/card/CardPreferenceRepository';
import feedSettingsRepository, {
  FeedSettingsRepository,
} from '../../databases/postgre/entities/card/FeedSettingsRepository';
import reviewSettingsRepository, {
  ReviewSettingsRepository,
} from '../../databases/postgre/entities/card/ReviewSettingsRepository';
import deskLibraryRepository, {
  DeskLibraryRepository,
} from '../../databases/postgre/entities/card/DeskLibraryRepository';
import friendshipRepository, {
  FriendshipRepository,
} from '../../databases/postgre/entities/user/FriendshipRepository';

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
    private readonly cardPreferenceRepository: CardPreferenceRepository,
    private readonly deskLibraryRepository: DeskLibraryRepository,
    private readonly friendshipRepository: FriendshipRepository
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

  async getDesksWithCard(originalCardId: number): Promise<string[]> {
    return await this.cardRepository.getDesksWithCard(originalCardId);
  }

  async getCardBySub(cardSub: string) {
    return await this.cardRepository.getCardBySub(cardSub);
  }

  async removeCardFromDesks(originalCardId: number, deskSubs: string[]) {
    await this.cardRepository.removeCardFromDesks(originalCardId, deskSubs);
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

    const cardDetails = await this.cardRepository.getCard(cardSub);
    await this.cloneCardWithExamples(
      originalCard,
      targetDeskSub,
      cardDetails?.examples ?? []
    );
  }

  async cloneCardToDesks(originalCard: { id: number; sub: string; front_variants: string[]; back_variants: string[]; image_key?: string | null }, deskSubs: string[]) {
    if (deskSubs.length === 0) return;

    const cardDetails = await this.cardRepository.getCard(originalCard.sub);
    const examples = cardDetails?.examples ?? [];

    await Promise.all(
      deskSubs.map((deskSub) => this.cloneCardWithExamples(originalCard, deskSub, examples))
    );
  }

  async addDeskToLibrary(userSub: string, sourceDeskSub: string) {
    if (await this.deskLibraryRepository.existsByUserAndSource(userSub, sourceDeskSub)) {
      throw new ConflictError('Desk already in library');
    }

    const sourceMeta = await this.cardRepository.getDeskPublicMeta(sourceDeskSub);
    if (!sourceMeta) {
      throw new NotFoundError('Desk not found');
    }

    if (sourceMeta.creator_sub === userSub) {
      throw new ForbiddenError('Cannot add your own desk to library');
    }

    if (sourceMeta.status !== 'active' || sourceMeta.is_inbox) {
      throw new ForbiddenError('Desk is not available');
    }

    const isFriend = await this.friendshipRepository.areAcceptedFriends(
      userSub,
      sourceMeta.creator_sub
    );

    if (!canAddDeskToLibrary(sourceMeta.visibility, { isFriend })) {
      throw new ForbiddenError('Desk is not shared with you');
    }

    const title = `${sourceMeta.title} (from @${sourceMeta.creator_nickname})`;
    await this.assertDeskTitleAvailable({
      title,
      creatorSub: userSub,
      folderSub: null,
    });

    const [sourceSettings, sourceCards] = await Promise.all([
      this.deskSettingsRepository.getByDeskSub(sourceDeskSub),
      this.cardRepository.getDeskCardsForLibraryClone(sourceDeskSub),
    ]);

    const localDeskSub = uuidV4();
    const libraryEntrySub = uuidV4();
    const tx = await this.cardRepository.startTransaction();

    try {
      await this.cardRepository.insertDeskInTx(tx, {
        sub: localDeskSub,
        title,
        description: sourceMeta.description ?? '',
        visibility: DESK_VISIBILITY.PRIVATE,
        creatorSub: userSub,
      });

      await this.cardRepository.insertDeskSettingsCopyInTx(tx, {
        deskSub: localDeskSub,
        cardsPerSession: sourceSettings?.cards_per_session ?? 10,
        cardOrientation: sourceSettings?.card_orientation ?? CARD_ORIENTATION.NORMAL,
        frontLanguage: sourceSettings?.front_language ?? DEFAULT_FRONT_LANGUAGE,
        backLanguage: sourceSettings?.back_language ?? DEFAULT_BACK_LANGUAGE,
        exampleLanguage: sourceSettings?.example_language ?? DEFAULT_EXAMPLE_LANGUAGE,
        studyMode: sourceSettings?.study_mode ?? DEFAULT_DESK_STUDY_MODE,
      });

      for (const card of sourceCards) {
        const newCardSub = uuidV4();
        await this.cardRepository.createCardCloneTx(tx, {
          sub: newCardSub,
          deskSub: localDeskSub,
          frontVariants: card.front_variants,
          backVariants: card.back_variants,
          imageKey: card.image_key ?? undefined,
          copyOf: card.id,
        });

        if (card.examples.length > 0) {
          await this.cardExampleRepository.createManyTx(tx, {
            cardSub: newCardSub,
            sentences: card.examples,
          });
        }
      }

      await this.deskLibraryRepository.insertInTx(tx, {
        sub: libraryEntrySub,
        userSub,
        sourceDeskSub,
        localDeskSub,
        sourceCreatorSub: sourceMeta.creator_sub,
      });

      await tx.commit();
    } catch (error: unknown) {
      await tx.rollback();
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new ConflictError('Desk already in library');
      }
      throw error;
    }

    return {
      sub: libraryEntrySub,
      localDeskSub,
      sourceDeskSub,
      title,
      cardCount: sourceCards.length,
    };
  }

  async getLibrarySources(userSub: string) {
    const rows = await this.deskLibraryRepository.getSourcesByUserSub(userSub);

    return rows.map((row) => ({
      sub: row.sub,
      sourceDeskSub: row.source_desk_sub,
      localDeskSub: row.local_desk_sub,
      sourceCreatorSub: row.source_creator_sub,
      sourceCreatorNickname: row.source_creator_nickname,
      sourceDeskTitle: row.source_desk_title,
      localDeskTitle: row.local_desk_title,
      mode: row.mode,
      createdAt: row.created_at,
    }));
  }

  private async cloneCardWithExamples(
    originalCard: {
      id: number;
      front_variants: string[];
      back_variants: string[];
      image_key?: string | null;
    },
    targetDeskSub: string,
    examples: string[],
    tx?: PgTransaction
  ): Promise<string> {
    const newCardSub = uuidV4();
    const cloneParams = {
      sub: newCardSub,
      deskSub: targetDeskSub,
      frontVariants: originalCard.front_variants,
      backVariants: originalCard.back_variants,
      imageKey: originalCard.image_key ?? undefined,
      copyOf: originalCard.id,
    };

    if (tx) {
      await this.cardRepository.createCardCloneTx(tx, cloneParams);
      if (examples.length > 0) {
        await this.cardExampleRepository.createManyTx(tx, {
          cardSub: newCardSub,
          sentences: examples,
        });
      }
    } else {
      await this.cardRepository.createCardClone(cloneParams);
      if (examples.length > 0) {
        await this.cardExampleRepository.createMany({
          cardSub: newCardSub,
          sentences: examples,
        });
      }
    }

    return newCardSub;
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

  async createInboxDesk(userSub: string): Promise<string> {
    const existingInboxSub = await this.cardRepository.getInboxDeskSub(userSub);
    if (existingInboxSub) {
      return existingInboxSub;
    }

    const sub = uuidV4();

    await this.cardRepository.createDesk({
      sub,
      title: INBOX_DESK_TITLE,
      description: INBOX_DESK_DESCRIPTION,
      visibility: DESK_VISIBILITY.PRIVATE,
      creatorSub: userSub,
      isInbox: true,
      frontLanguage: DEFAULT_FRONT_LANGUAGE,
      backLanguage: DEFAULT_BACK_LANGUAGE,
      exampleLanguage: DEFAULT_EXAMPLE_LANGUAGE,
    });

    return sub;
  }

  async ensureInboxDesk(userSub: string): Promise<string> {
    const inboxDeskSub = await this.cardRepository.getInboxDeskSub(userSub);
    if (inboxDeskSub) {
      return inboxDeskSub;
    }

    return this.createInboxDesk(userSub);
  }

  async getInboxSummary(userSub: string) {
    const inboxDeskSub = await this.ensureInboxDesk(userSub);
    const count = await this.cardRepository.getInboxNewCardCount(userSub);

    return {
      count,
      deskSub: inboxDeskSub,
    };
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
      sourceCreatorNickname?: string;
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

    const [deskInfo, weeklyStats] = await Promise.all([
      this.cardRepository.getDeskDetails({
        deskSub: desk_sub,
        userSub: sub,
        cardLimit: DESK_PREVIEW_CARD_LIMIT,
      }),
      this.gameSessionRepository.getWeeklyDeskStats(sub, desk_sub),
    ]);

    if (!deskInfo || !weeklyStats) return;

    const { stats, cards, ...rest } = deskInfo;

    return {
      ...rest,
      cards: cards.map((card) => mapCardImageUrl(card)),
      stats: { ...stats, weeklyStats },
    };
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

    return (await this.cardRepository.getDeskCards({ deskSub: desk_sub })).map((card) =>
      mapCardImageUrl(card)
    );
  }

  async getPublicDesk(params: { deskSub: string; viewerSub?: string; limit?: number; offset?: number }) {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const offset = Math.max(params.offset ?? 0, 0);

    const meta = await this.cardRepository.getDeskPublicMeta(params.deskSub);
    if (!meta) {
      throw new NotFoundError('Desk not found');
    }

    if (meta.status !== 'active' || meta.is_inbox) {
      throw new ForbiddenError('Desk is not available');
    }

    const isOwner = params.viewerSub === meta.creator_sub;
    const isFriend =
      params.viewerSub && !isOwner
        ? await this.friendshipRepository.areAcceptedFriends(params.viewerSub, meta.creator_sub)
        : false;

    if (!canViewDeskVisibility(meta.visibility, { isOwner, isFriend })) {
      throw new ForbiddenError('Desk is not available');
    }

    const cards = await this.cardRepository.getPublicDeskCardPreviews({
      deskSub: params.deskSub,
      limit,
      offset,
    });

    return {
      sub: meta.sub,
      title: meta.title,
      description: meta.description ?? '',
      creatorNickname: meta.creator_nickname,
      cardCount: meta.card_count,
      cards: cards.map((card) => ({
        sub: card.sub,
        frontVariants: card.front_variants,
      })),
      pagination: {
        limit,
        offset,
        hasMore: offset + cards.length < meta.card_count,
      },
    };
  }

  async createCard(payload: { front: string[]; back: string[]; desk_sub: string }) {
    const deskExist = await this.cardRepository.existDesk({ sub: payload.desk_sub });
    if (!deskExist) {
      throw new NotFoundError(`CardService: desk with sub = ${payload.desk_sub} not found`);
    }

    const sub = uuidV4();
    await this.cardRepository.createCard({ sub, ...payload });

    const deskSettings = await this.deskSettingsRepository.getByDeskSub(payload.desk_sub);
    const languageConfig = {
      exampleLanguage: deskSettings?.example_language ?? DEFAULT_EXAMPLE_LANGUAGE,
      frontLanguage: deskSettings?.front_language ?? DEFAULT_FRONT_LANGUAGE,
      backLanguage: deskSettings?.back_language ?? DEFAULT_BACK_LANGUAGE,
    };

    void this.generateExamples(sub, payload.front, payload.back, languageConfig);

    return sub;
  }

  async regenerateExamples(payload: { cardSub: string; creatorSub: string }) {
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
        `CardService: user with sub = ${creatorSub} cannot regenerate examples for card with sub = ${cardSub}`
      );
    }

    const card = await this.cardRepository.getCardBySub(cardSub);
    if (!card) {
      throw new NotFoundError(`CardService: card with sub = ${cardSub} not found`);
    }

    const front = card.front_variants ?? [];
    const back = card.back_variants ?? [];
    if (!front.length || !back.length) {
      throw new BadRequestError('Card must have front and back variants to generate examples');
    }

    const deskSettings = await this.deskSettingsRepository.getByDeskSub(card.desk_sub);
    const languageConfig = {
      exampleLanguage: deskSettings?.example_language ?? DEFAULT_EXAMPLE_LANGUAGE,
      frontLanguage: deskSettings?.front_language ?? DEFAULT_FRONT_LANGUAGE,
      backLanguage: deskSettings?.back_language ?? DEFAULT_BACK_LANGUAGE,
    };

    await this.cardExampleRepository.deleteByCardSub(cardSub);

    const examples = await this.generateAndSaveExamples(
      cardSub,
      front,
      back,
      languageConfig
    );

    return { examples };
  }

  async createDesk(payload: {
    sub: string;
    title: string;
    description: string;
    visibility: DeskVisibility;
    creatorSub: string;
    folderSub: string | null;
    frontLanguage?: LanguageCode;
    backLanguage?: LanguageCode;
    exampleLanguage?: LanguageCode;
  }) {
    const { folderSub, frontLanguage, backLanguage, exampleLanguage, visibility, ...rest } = payload;

    if (folderSub) {
      const exist = await this.cardRepository.existFolderBySub(folderSub);
      if (!exist) {
        throw new NotFoundError(`Folder with sub = ${folderSub} not found`);
      }
    }

    await this.assertDeskTitleAvailable({
      title: payload.title,
      creatorSub: payload.creatorSub,
      folderSub: payload.folderSub,
    });

    const created_at = await this.cardRepository.createDesk({
      ...rest,
      visibility,
      frontLanguage,
      backLanguage,
      exampleLanguage,
    });

    if (folderSub) {
      await this.cardRepository.addDeskToFolder(payload.sub, folderSub);
    }

    return {
      sub: payload.sub,
      title: payload.title,
      description: payload.description,
      visibility,
      public: visibilityToLegacyPublic(visibility),
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
      await this.cardRepository.createFolder({ sub, ...payload });
      return { sub };
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
    return { sub };
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

  async getAllFoldersFlat(creatorSub: string) {
    return await this.cardRepository.getAllFoldersFlat(creatorSub);
  }

  async moveDeskToFolder(payload: {
    deskSub: string;
    folderSub: string | null;
    creatorSub: string;
  }) {
    const { deskSub, folderSub, creatorSub } = payload;

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
        `CardService: user with sub = ${creatorSub} cannot move desk with sub = ${deskSub}`
      );
    }

    const currentFolderSub = await this.cardRepository.getDeskFolderSub(deskSub);
    if (currentFolderSub === folderSub) {
      return;
    }

    const title = await this.cardRepository.getDeskTitle(deskSub);
    if (!title) {
      throw new NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
    }

    if (folderSub) {
      const folderExists = await this.cardRepository.existFolderBySub(folderSub);
      if (!folderExists) {
        throw new NotFoundError(`Folder with sub = ${folderSub} not found`);
      }

      const haveFolderAccess = await this.cardRepository.haveAccessToFolder(folderSub, creatorSub);
      if (!haveFolderAccess) {
        throw new ForbiddenError(
          `User with sub = ${creatorSub} don't have access to folder with sub = ${folderSub}`
        );
      }
    }

    await this.assertDeskTitleAvailable({
      title,
      creatorSub,
      folderSub,
      excludeDeskSub: deskSub,
    });

    await this.cardRepository.removeDeskFromFolders(deskSub);

    if (folderSub) {
      await this.cardRepository.addDeskToFolder(deskSub, folderSub);
    }
  }

  async moveFolderToParent(payload: {
    folderSub: string;
    parentFolderSub: string | null;
    creatorSub: string;
  }) {
    const { folderSub, parentFolderSub, creatorSub } = payload;

    const folderExists = await this.cardRepository.existFolderBySub(folderSub);
    if (!folderExists) {
      throw new NotFoundError(`Folder with sub = ${folderSub} not found`);
    }

    const haveAccess = await this.cardRepository.haveAccessToFolder(folderSub, creatorSub);
    if (!haveAccess) {
      throw new ForbiddenError(
        `User with sub = ${creatorSub} don't have access to folder with sub = ${folderSub}`
      );
    }

    const folder = await this.cardRepository.getFolderParent(folderSub);
    if (!folder) {
      throw new NotFoundError(`Folder with sub = ${folderSub} not found`);
    }

    if (folder.parentFolderSub === parentFolderSub) {
      return;
    }

    if (parentFolderSub) {
      const isInvalidTarget = await this.cardRepository.isFolderDescendantOrSelf(
        folderSub,
        parentFolderSub,
        creatorSub
      );
      if (isInvalidTarget) {
        throw new BadRequestError('Cannot move a folder into itself or its subfolder');
      }

      const parentExists = await this.cardRepository.existFolderBySub(parentFolderSub);
      if (!parentExists) {
        throw new NotFoundError(`Folder with sub = ${parentFolderSub} not found`);
      }

      const haveParentAccess = await this.cardRepository.haveAccessToFolder(
        parentFolderSub,
        creatorSub
      );
      if (!haveParentAccess) {
        throw new ForbiddenError(
          `User with sub = ${creatorSub} don't have access to folder with sub = ${parentFolderSub}`
        );
      }

      const titleExists = await this.cardRepository.existFolderWithTitleAndParent({
        title: folder.title,
        folderSub: parentFolderSub,
        creatorSub,
      });
      if (titleExists) {
        throw new BadRequestError(
          `Folder with title = ${folder.title} already exists in target folder`
        );
      }
    } else {
      const titleExists = await this.cardRepository.existFolderWithTitle({
        title: folder.title,
        creatorSub,
      });
      if (titleExists) {
        throw new BadRequestError(
          `Folder with title = ${folder.title} already exists at root level`
        );
      }
    }

    await this.cardRepository.updateFolderParent(folderSub, parentFolderSub);
  }

  async updateDesk(payload: {
    deskSub: string;
    body: { title: string; description: string; visibility?: DeskVisibility };
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

    const currentTitle = await this.cardRepository.getDeskTitle(deskSub);
    if (currentTitle && body.title !== currentTitle) {
      const folderSub = await this.cardRepository.getDeskFolderSub(deskSub);
      await this.assertDeskTitleAvailable({
        title: body.title,
        creatorSub,
        folderSub,
        excludeDeskSub: deskSub,
      });
    }

    await this.cardRepository.updateDesk({
      desk_sub: deskSub,
      payload: body,
    });
  }

  async updateFeedSettings(payload: {
    cardOrientation: CARD_ORIENTATION;
    studyMode: StudyMode;
    creatorSub: string;
  }) {
    const { cardOrientation, studyMode, creatorSub } = payload;
    const exist = await this.feedSettingsRepository.existByUserSub(creatorSub);
    if (!exist) {
      throw new NotFoundError(
        `CardService: feed settings for user with sub = ${creatorSub} not found`
      );
    }

    await this.cardRepository.updateFeedSettings({
      userSub: creatorSub,
      cardOrientation,
      studyMode,
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

    return mapCardImageUrl(res);
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

    await cardImageService.deleteImageForCard(cardSub);
    await this.cardRepository.deleteCard({ cardSub });
  }

  async getUsersWithDueCards() {
    return await this.userCardSrsRepository.getUsersWithDueCards();
  }

  async getReviewDueSummary(userSub: string) {
    const [totalDueCount, desks] = await Promise.all([
      this.userCardSrsRepository.getDueCountForUser(userSub),
      this.userCardSrsRepository.getDueCountByDesk(userSub),
    ]);

    return {
      totalDueCount,
      desks: desks.map((desk) => ({
        deskSub: desk.desk_sub,
        title: desk.title,
        dueCount: desk.due_count,
      })),
    };
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

    const duelService = (await import('../../services/games/duel/DuelService')).default;
    await duelService.cancelActiveDuelsForDesk(deskSub);
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
    body: {
      cards_per_session: number;
      card_orientation: CARD_ORIENTATION;
      front_language: LanguageCode;
      back_language: LanguageCode;
      example_language: LanguageCode;
      study_mode: StudyMode;
    };
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

  async updateReviewSettings(payload: {
    body: { cards_per_session: number; study_mode: StudyMode };
    creatorSub: string;
  }) {
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
      study_mode: body.study_mode,
    });
  }

  private async assertDeskTitleAvailable(params: {
    title: string;
    creatorSub: string;
    folderSub: string | null;
    excludeDeskSub?: string;
  }) {
    const { title, creatorSub, folderSub, excludeDeskSub } = params;

    const titleExists = folderSub
      ? await this.cardRepository.existDeskWithTitleAndFolder({
          title,
          folderSub,
          creatorSub,
          excludeDeskSub,
        })
      : await this.cardRepository.existDeskWithTitle({
          title,
          creatorSub,
          excludeDeskSub,
        });

    if (titleExists) {
      throw new BadRequestError(
        folderSub
          ? `Desk with title = ${title} already exists in this folder`
          : `Desk with title = ${title} already exists at root level`
      );
    }
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

  private async generateExamples(
    cardSub: string,
    front: string[],
    back: string[],
    languageConfig: {
      exampleLanguage: LanguageCode;
      frontLanguage: LanguageCode;
      backLanguage: LanguageCode;
    }
  ) {
    try {
      await this.generateAndSaveExamples(cardSub, front, back, languageConfig);
    } catch (error) {
      console.error('💥 Error generating examples:', error);
    }
  }

  private async generateAndSaveExamples(
    cardSub: string,
    front: string[],
    back: string[],
    languageConfig: {
      exampleLanguage: LanguageCode;
      frontLanguage: LanguageCode;
      backLanguage: LanguageCode;
    }
  ): Promise<string[]> {
    if (!front.length || !back.length) return [];

    const isProd = process.env.NODE_ENV === 'production';

    const examples = isProd
      ? await this.generateExamplesWithGemini(front, back, languageConfig)
      : await this.getExamplesTemplates(front, languageConfig.exampleLanguage);

    if (examples.length > 0) {
      await this.cardExampleRepository.createMany({ cardSub, sentences: examples });
    } else {
      console.log('❌ No examples found from Gemini');
    }

    return examples;
  }

  private async getExamplesTemplates(words: string[], language: LanguageCode): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const langName = LANGUAGE_NAMES[language];

    return [
      `[${langName}] First sentence with words: ${words.join(', ')}`,
      `[${langName}] Second sentence with words: ${words.join(', ')}`,
      `[${langName}] Third sentence with words: ${words.join(', ')}`,
      `[${langName}] Fourth sentence with words: ${words.join(', ')}`,
      `[${langName}] Fifth sentence with words: ${words.join(', ')}`,
    ];
  }

  private buildExamplesPrompt(
    words: string[],
    back: string[],
    languageConfig: {
      exampleLanguage: LanguageCode;
      frontLanguage: LanguageCode;
      backLanguage: LanguageCode;
    }
  ): string {
    const wordsString = words.map((w) => `"${w}"`).join(', ');
    const langName = LANGUAGE_NAMES[languageConfig.exampleLanguage];
    const showTranslationContext =
      languageConfig.frontLanguage !== languageConfig.backLanguage && back.length > 0;
    const translationsString = back.map((w) => `"${w}"`).join(', ');
    const translationContext = showTranslationContext
      ? `\nTranslations (for context only, do NOT include in sentences): ${translationsString}\n`
      : '';

    return `Generate 5 diverse example sentences in ${langName} that use the following words: ${wordsString}.
${translationContext}
        Requirements:
        1. Each sentence must be written in ${langName}
        2. Each sentence should use ONE OR MORE of the given words
        3. Different sentences should use DIFFERENT words from the list
        4. Each word from the list should appear in at least one sentence
        5. Sentences should be 8-25 words each
        6. Use modern, natural ${langName}
        7. Cover different contexts and grammatical structures
        8. Ensure sentences are grammatically correct
        9. Make sentences interesting and informative

        Format: Return each sentence on a new line without numbers or bullets.`;
  }

  private async generateExamplesWithGemini(
    words: string[],
    back: string[],
    languageConfig: {
      exampleLanguage: LanguageCode;
      frontLanguage: LanguageCode;
      backLanguage: LanguageCode;
    }
  ): Promise<string[]> {
    try {
      const prompt = this.buildExamplesPrompt(words, back, languageConfig);

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
  cardPreferenceRepository,
  deskLibraryRepository,
  friendshipRepository
);
