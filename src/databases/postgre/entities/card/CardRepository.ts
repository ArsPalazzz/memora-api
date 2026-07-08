import Table, { PgTransaction } from '../Table';
import Postgres, { Query } from '../../index';
import {
  ADD_DESK_TO_FOLDER,
  ARCHIVE_DESK,
  DELETE_CARD,
  EXIST_CARD,
  EXIST_CARD_BY_SUB,
  EXIST_DESK,
  EXIST_DESK_WITH_THIS_TITLE,
  EXIST_DESK_WITH_THIS_TITLE_AND_FOLDER,
  EXIST_FOLDER_BY_SUB,
  EXIST_FOLDER_WITH_THIS_TITLE,
  EXIST_FOLDER_WITH_THIS_TITLE_AND_PARENT,
  GET_ARCHIVED_DESKS_BY_CREATOR_SUB,
  GET_CARD,
  GET_CARD_SUBS_FOR_PLAY,
  GET_CARDS,
  GET_DESK_CARDS,
  GET_DESK_DETAILS,
  GET_DESK_SUBS_BY_CREATOR_SUB,
  GET_DESKS_BY_CREATOR_SUB,
  GET_INBOX_DESK_BY_CREATOR,
  GET_INBOX_NEW_CARD_COUNT,
  GET_PUBLIC_DESKS_BY_CREATOR,
  GET_PROFILE_DESKS_BY_CREATOR,
  GET_DESK_PUBLIC_META,
  GET_PUBLIC_DESK_CARD_PREVIEWS,
  GET_FOLDER_CONTENTS,
  GET_FOLDER_INFO,
  GET_DESK_FOLDER,
  GET_DESK_TITLE,
  GET_FOLDER_PARENT,
  GET_FOLDER_TREE,
  GET_FOLDERS_FLAT,
  GET_ROOT_FOLDERS,
  HAVE_ACCESS_TO_CARD,
  HAVE_ACCESS_TO_DESK,
  CAN_USER_VIEW_DESK,
  HAVE_ACCESS_TO_FOLDER,
  INSERT_CARD,
  INSERT_DESK,
  INSERT_DESK_SETTINGS,
  INSERT_FOLDER,
  IS_FOLDER_DESCENDANT_OR_SELF,
  DELETE_CARDS_BY_DESK_SUB,
  GET_CARDS_WITH_EXAMPLES_BY_DESK,
  GET_DESK_CARDS_FOR_LIBRARY_CLONE,
  INSERT_DESK_SETTINGS_COPY,
  GET_DESK_SUB_BY_TITLE_AT_ROOT,
  GET_DESK_SUB_BY_TITLE_IN_FOLDER,
  REMOVE_DESK_FROM_FOLDERS,
  RESTORE_DESK,
  UPDATE_CARD,
  UPDATE_DESK,
  UPDATE_DESK_WITH_VISIBILITY,
  UPDATE_DESK_SETTINGS,
  UPDATE_FOLDER_PARENT,
  UPDATE_FEED_SETTINGS,
  UPDATE_LAST_TIME_PLAYED_DESK,
} from './CardRepositoryQueries';
import {
  Folder,
  FolderContentItem,
  FolderFlatItem,
  FolderInfo,
  GetDeskCardsResult,
  GetDeskDetailsResult,
  GetFolderContentsRes,
  GetRootFoldersRes,
} from '../../../../services/cards/card.interfaces';
import {
  CARD_ORIENTATION,
  DEFAULT_BACK_LANGUAGE,
  DEFAULT_EXAMPLE_LANGUAGE,
  DEFAULT_FRONT_LANGUAGE,
  DeskVisibility,
  LanguageCode,
  visibilityToLegacyPublic,
} from '../../../../services/cards/card.const';
import { StudyMode } from '../../../../services/games/studyMode.const';
import { DatabaseError } from '../../../../exceptions';

interface CreateCardParams {
  sub: string;
  deskSub: string;
  frontVariants: string[];
  backVariants: string[];
  imageKey?: string;
  copyOf?: number;
}

export class CardRepository extends Table {
  async getCards() {
    const query: Query = {
      name: 'getCards',
      text: GET_CARDS,
      values: [],
    };

    return this.getItems<any>(query);
  }

  async getCardBySub(cardSub: string) {
    const query: Query = {
      name: 'getCardBySub',
      text: `
        SELECT 
          id,
          sub,
          desk_sub,
          front_variants,
          back_variants,
          image_key
        FROM cards.card
        WHERE sub = $1
      `,
      values: [cardSub],
    };

    return this.getItem<{
      id: number;
      sub: string;
      desk_sub: string;
      front_variants: string[];
      back_variants: string[];
      image_key?: string | null;
    }>(query);
  }

  async getDesksWithCard(originalCardId: number): Promise<string[]> {
    const query: Query = {
      name: 'getDesksWithCard',
      text: `
      SELECT desk_sub
      FROM cards.card
      WHERE copy_of = $1
    `,
      values: [originalCardId],
    };

    const cards = await this.getItems<{ desk_sub: string }>(query);
    return cards.map((card) => card.desk_sub);
  }

  async removeCardFromDesks(originalCardId: number, deskSubs: string[]) {
    for (const deskSub of deskSubs) {
      const query: Query = {
        name: 'removeCardFromDesks',
        text: `
          DELETE FROM cards.card
          WHERE copy_of = $1
          AND desk_sub = $2
        `,
        values: [originalCardId, deskSub],
      };

      await this.getItem(query);
    }
  }

  async createCardClone(card: {
    sub: string;
    deskSub: string;
    frontVariants: string[];
    backVariants: string[];
    imageKey?: string;
    copyOf: number;
  }): Promise<void> {
    const query: Query = {
      name: 'createCardClone',
      text: `
      INSERT INTO cards.card 
        (sub, desk_sub, front_variants, back_variants, image_key, copy_of)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      values: [
        card.sub,
        card.deskSub,
        JSON.stringify(card.frontVariants),
        JSON.stringify(card.backVariants),
        card.imageKey || null,
        card.copyOf,
      ],
    };

    await this.insertItem(query);
  }

  async create(params: CreateCardParams) {
    const { sub, deskSub, frontVariants, backVariants, imageKey, copyOf } = params;

    const query: Query = {
      name: 'createCard',
      text: `
        INSERT INTO cards.card 
          (sub, desk_sub, front_variants, back_variants, image_key, copy_of, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      values: [
        sub,
        deskSub,
        JSON.stringify(frontVariants),
        JSON.stringify(backVariants),
        imageKey ?? null,
        copyOf,
      ],
    };

    return this.updateItems(query);
  }

  async getCardSubsForPlay(deskSub: string, cardsPerSession: number) {
    const query: Query = {
      name: 'getCardSubsForPlay',
      text: GET_CARD_SUBS_FOR_PLAY,
      values: [deskSub, cardsPerSession],
    };

    return this.getItems<{ sub: string }>(query);
  }

  async getDesksByCreatorSub(userSub: string) {
    const query: Query = {
      name: 'getDesksByCreatorSub',
      text: GET_DESKS_BY_CREATOR_SUB,
      values: [userSub],
    };

    const result = await this.getItems<{
      sub: string;
      title: string;
      status: string;
      description: string;
      totalCards: string;
      newCards: string;
      dueCards: string;
      learningCards: string;
      masteredCards: string;
      sourceCreatorNickname: string | null;
    }>(query);

    return result
      .filter((item) => item.status === 'active')
      .map((item) => ({
        ...item,
        totalCards: parseInt(item.totalCards, 10) || 0,
        newCards: parseInt(item.newCards, 10) || 0,
        dueCards: parseInt(item.dueCards, 10) || 0,
        learningCards: parseInt(item.learningCards, 10) || 0,
        masteredCards: parseInt(item.masteredCards, 10) || 0,
        sourceCreatorNickname: item.sourceCreatorNickname ?? undefined,
      }));
  }

  async getInboxDeskSub(userSub: string): Promise<string | null> {
    const query: Query = {
      name: 'getInboxDeskSub',
      text: GET_INBOX_DESK_BY_CREATOR,
      values: [userSub],
    };

    const row = await this.getItem<{ sub: string }>(query);
    return row?.sub ?? null;
  }

  async getInboxNewCardCount(userSub: string): Promise<number> {
    const query: Query = {
      name: 'getInboxNewCardCount',
      text: GET_INBOX_NEW_CARD_COUNT,
      values: [userSub],
    };

    const row = await this.getItem<{ count: number }>(query);
    return row?.count ?? 0;
  }

  async getPublicDesksByCreatorSub(userSub: string) {
    const query: Query = {
      name: 'getPublicDesksByCreatorSub',
      text: GET_PUBLIC_DESKS_BY_CREATOR,
      values: [userSub],
    };

    return this.getItems<{
      sub: string;
      title: string;
      card_count: number;
      total_saves: number;
    }>(query);
  }

  async getProfileDesksByCreatorSub(creatorSub: string, includeFriendsDesks: boolean) {
    const query: Query = {
      name: 'getProfileDesksByCreatorSub',
      text: GET_PROFILE_DESKS_BY_CREATOR,
      values: [creatorSub, includeFriendsDesks],
    };

    return this.getItems<{
      sub: string;
      title: string;
      card_count: number;
      total_saves: number;
    }>(query);
  }

  async getDeskPublicMeta(deskSub: string) {
    const query: Query = {
      name: 'getDeskPublicMeta',
      text: GET_DESK_PUBLIC_META,
      values: [deskSub],
    };

    return this.getItem<{
      sub: string;
      title: string;
      description: string | null;
      public: boolean;
      visibility: DeskVisibility;
      status: string;
      is_inbox: boolean;
      creator_sub: string;
      creator_nickname: string;
      card_count: number;
    }>(query);
  }

  async getPublicDeskCardPreviews(params: {
    deskSub: string;
    limit: number;
    offset: number;
  }) {
    const query: Query = {
      name: 'getPublicDeskCardPreviews',
      text: GET_PUBLIC_DESK_CARD_PREVIEWS,
      values: [params.deskSub, params.limit, params.offset],
    };

    return this.getItems<{
      sub: string;
      front_variants: string[];
    }>(query);
  }

  async getArchivedDesksByCreatorSub(userSub: string) {
    const query: Query = {
      name: 'getArchivedDesksByCreatorSub',
      text: GET_ARCHIVED_DESKS_BY_CREATOR_SUB,
      values: [userSub],
    };

    const result = await this.getItems<{
      sub: string;
      title: string;
      status: string;
      description: string;
      totalCards: string;
      newCards: string;
      dueCards: string;
      learningCards: string;
      masteredCards: string;
    }>(query);

    return result.map((item) => ({
      ...item,
      totalCards: parseInt(item.totalCards, 10) || 0,
      newCards: parseInt(item.newCards, 10) || 0,
      dueCards: parseInt(item.dueCards, 10) || 0,
      learningCards: parseInt(item.learningCards, 10) || 0,
      masteredCards: parseInt(item.masteredCards, 10) || 0,
    }));
  }

  async getDeskShortByCreatorSub(userSub: string) {
    const query: Query = {
      name: 'getDeskSubsByCreatorSub',
      text: GET_DESK_SUBS_BY_CREATOR_SUB,
      values: [userSub],
    };

    return await this.getItems<{ sub: string; title: string; folderSub: string | null }>(query);
  }

  async getDeskDetails(params: { deskSub: string; userSub: string }) {
    const query: Query = {
      name: 'getDeskDetails',
      text: GET_DESK_DETAILS,
      values: [params.deskSub, params.userSub],
    };

    return this.getItem<GetDeskDetailsResult>(query);
  }

  async getDeskCards(params: { deskSub: string }) {
    const query: Query = {
      name: 'getDeskCards',
      text: GET_DESK_CARDS,
      values: [params.deskSub],
    };

    return this.getItems<GetDeskCardsResult>(query);
  }

  async isDeskOwner(userSub: string, deskSub: string) {
    const query: Query = {
      name: 'isDeskOwner',
      text: `
        SELECT EXISTS (
          SELECT 1 FROM cards.desk 
          WHERE sub = $1 AND creator_sub = $2
        ) as exists
      `,
      values: [deskSub, userSub],
    };

    const result = await this.getItem<{ exists: boolean }>(query);
    return result?.exists || false;
  }

  async getUserDesks(userSub: string) {
    const query: Query = {
      name: 'getUserDesks',
      text: `
        SELECT sub, title 
        FROM cards.desk 
        WHERE creator_sub = $1 AND status = 'active'
        ORDER BY created_at DESC
      `,
      values: [userSub],
    };

    return this.getItems<{ sub: string; title: string }>(query);
  }

  async createCard(params: { sub: string; front: string[]; back: string[]; desk_sub: string }) {
    const query: Query = {
      name: 'createCard',
      text: INSERT_CARD,
      values: [
        params.desk_sub,
        JSON.stringify(params.front),
        JSON.stringify(params.back),
        params.sub,
      ],
    };

    return this.insertItem<string>(query, 'sub');
  }

  async existCard(params: { id: number }) {
    const query: Query = {
      name: 'existCard',
      text: EXIST_CARD,
      values: [params.id],
    };

    return this.exists(query);
  }

  async existCardBySub(params: { sub: string }) {
    const query: Query = {
      name: 'existCardBySub',
      text: EXIST_CARD_BY_SUB,
      values: [params.sub],
    };

    return this.exists(query);
  }

  async existDesk(params: { sub: string }) {
    const query: Query = {
      name: 'existDesk',
      text: EXIST_DESK,
      values: [params.sub],
    };

    return this.exists(query);
  }

  async existDeskWithTitle(params: {
    title: string;
    creatorSub: string;
    excludeDeskSub?: string;
  }) {
    const query: Query = {
      name: 'existDeskWithTitle',
      text: EXIST_DESK_WITH_THIS_TITLE,
      values: [params.title, params.creatorSub, params.excludeDeskSub ?? null],
    };

    return this.exists(query);
  }

  async existDeskWithTitleAndFolder(params: {
    title: string;
    folderSub: string;
    creatorSub: string;
    excludeDeskSub?: string;
  }) {
    const query: Query = {
      name: 'existDeskWithTitleAndFolder',
      text: EXIST_DESK_WITH_THIS_TITLE_AND_FOLDER,
      values: [
        params.title,
        params.folderSub,
        params.creatorSub,
        params.excludeDeskSub ?? null,
      ],
    };

    return this.exists(query);
  }

  async existFolderWithTitleAndParent(params: {
    title: string;
    folderSub: string;
    creatorSub: string;
  }) {
    const query: Query = {
      name: 'existFolderWithTitleAndParent',
      text: EXIST_FOLDER_WITH_THIS_TITLE_AND_PARENT,
      values: [params.title, params.folderSub, params.creatorSub],
    };

    return this.exists(query);
  }

  async existFolderWithTitle(params: { title: string; creatorSub: string }) {
    const query: Query = {
      name: 'existFolderWithTitle',
      text: EXIST_FOLDER_WITH_THIS_TITLE,
      values: [params.title, params.creatorSub],
    };

    return this.exists(query);
  }

  async updateLastTimePlayedDesk(deskSub: string, tx: PgTransaction) {
    return tx.query({
      name: 'updateLastTimePlayedDesk',
      text: UPDATE_LAST_TIME_PLAYED_DESK,
      values: [deskSub],
    });
  }

  async haveAccessToDesk(params: { user_sub: string; desk_sub: string }) {
    const query: Query = {
      name: 'haveAccessToDesk',
      text: HAVE_ACCESS_TO_DESK,
      values: [params.desk_sub, params.user_sub],
    };

    return this.exists(query);
  }

  async canUserViewDesk(params: { user_sub: string; desk_sub: string }) {
    const query: Query = {
      name: 'canUserViewDesk',
      text: CAN_USER_VIEW_DESK,
      values: [params.desk_sub, params.user_sub],
    };

    return this.exists(query);
  }

  async haveAccessToCard(params: { user_sub: string; card_sub: string }) {
    const query: Query = {
      name: 'haveAccessToCard',
      text: HAVE_ACCESS_TO_CARD,
      values: [params.card_sub, params.user_sub],
    };

    return this.exists(query);
  }

  async createDesk(params: {
    sub: string;
    title: string;
    description: string;
    visibility: DeskVisibility;
    creatorSub: string;
    isInbox?: boolean;
    frontLanguage?: LanguageCode;
    backLanguage?: LanguageCode;
    exampleLanguage?: LanguageCode;
  }) {
    const tx = await this.startTransaction();
    const isPublic = visibilityToLegacyPublic(params.visibility);

    try {
      const desk = await tx.query({
        name: 'insertDesk',
        text: INSERT_DESK,
        values: [
          params.sub,
          params.title,
          params.description,
          isPublic,
          params.visibility,
          params.creatorSub,
          params.isInbox ?? false,
        ],
      });

      await tx.query({
        name: 'insertDeskSettings',
        text: INSERT_DESK_SETTINGS,
        values: [
          params.sub,
          params.frontLanguage ?? DEFAULT_FRONT_LANGUAGE,
          params.backLanguage ?? DEFAULT_BACK_LANGUAGE,
          params.exampleLanguage ?? DEFAULT_EXAMPLE_LANGUAGE,
        ],
      });

      await tx.commit();
      return desk.rows[0].created_at;
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }

  async createFolder(params: {
    sub: string;
    title: string;
    description: string;
    creatorSub: string;
    parentFolderSub: string | null;
  }) {
    const query: Query = {
      name: 'insertFolder',
      text: INSERT_FOLDER,
      values: [
        params.sub,
        params.title,
        params.description,
        params.creatorSub,
        params.parentFolderSub,
      ],
    };

    return this.insertItem(query);
  }

  async existFolderBySub(sub: string) {
    const query: Query = {
      name: 'existFolderBySub',
      text: EXIST_FOLDER_BY_SUB,
      values: [sub],
    };

    return this.exists(query);
  }

  async addDeskToFolder(deskSub: string, folderSub: string) {
    const query: Query = {
      name: 'addDeskToFolder',
      text: ADD_DESK_TO_FOLDER,
      values: [folderSub, deskSub],
    };

    return this.insertItem(query);
  }

  async haveAccessToFolder(folderSub: string, userSub: string) {
    const query: Query = {
      name: 'haveAccessToFolder',
      text: HAVE_ACCESS_TO_FOLDER,
      values: [folderSub, userSub],
    };

    return this.exists(query);
  }

  async getFolders(creatorSub: string): Promise<Folder[]> {
    const query: Query = {
      name: 'getFoldersByCreatorSub',
      text: GET_FOLDER_TREE,
      values: [creatorSub],
    };

    return await this.getItems(query);
  }

  async getFolderContents(folderSub: string, creatorSub: string): Promise<GetFolderContentsRes[]> {
    const query: Query = {
      name: 'getFolderContents',
      text: GET_FOLDER_CONTENTS,
      values: [folderSub, creatorSub],
    };

    const res = await this.getItems<FolderContentItem>(query);

    return res.map(({ childCount, ...item }) => ({
      ...item,
      totalCards: Number(item.totalCards),
      newCards: Number(item.newCards),
      dueCards: Number(item.dueCards),
      learningCards: Number(item.learningCards),
      masteredCards: Number(item.masteredCards),
      deskCount: Number(item.deskCount),
      folderCount: Number(childCount),
    }));
  }

  async getFolderInfo(folderSub: string): Promise<FolderInfo | null> {
    const query: Query = {
      name: 'getFolderInfo',
      text: GET_FOLDER_INFO,
      values: [folderSub],
    };

    const result = await this.getItem<FolderInfo>(query);
    if (!result) return null;

    return {
      sub: result.sub,
      title: result.title,
      description: result.description,
      parentFolderSub: result.parentFolderSub,
      createdAt: result.createdAt,
      deskCount: Number(result.deskCount),
      childCount: Number(result.childCount),
    };
  }

  async getAllFoldersFlat(creatorSub: string): Promise<FolderFlatItem[]> {
    const query: Query = {
      name: 'getAllFoldersFlat',
      text: GET_FOLDERS_FLAT,
      values: [creatorSub],
    };

    return this.getItems(query);
  }

  async getDeskFolderSub(deskSub: string): Promise<string | null> {
    const query: Query = {
      name: 'getDeskFolderSub',
      text: GET_DESK_FOLDER,
      values: [deskSub],
    };

    const result = await this.getItem<{ folderSub: string }>(query);
    return result?.folderSub ?? null;
  }

  async getFolderParent(folderSub: string): Promise<{ parentFolderSub: string | null; title: string } | null> {
    const query: Query = {
      name: 'getFolderParent',
      text: GET_FOLDER_PARENT,
      values: [folderSub],
    };

    return this.getItem(query);
  }

  async getDeskTitle(deskSub: string): Promise<string | null> {
    const query: Query = {
      name: 'getDeskTitle',
      text: GET_DESK_TITLE,
      values: [deskSub],
    };

    const result = await this.getItem<{ title: string }>(query);
    return result?.title ?? null;
  }

  async removeDeskFromFolders(deskSub: string) {
    const query: Query = {
      name: 'removeDeskFromFolders',
      text: REMOVE_DESK_FROM_FOLDERS,
      values: [deskSub],
    };

    return this.updateItems(query);
  }

  async updateFolderParent(folderSub: string, parentFolderSub: string | null) {
    const query: Query = {
      name: 'updateFolderParent',
      text: UPDATE_FOLDER_PARENT,
      values: [folderSub, parentFolderSub],
    };

    return this.updateItems(query);
  }

  async isFolderDescendantOrSelf(
    folderSub: string,
    targetSub: string,
    creatorSub: string
  ): Promise<boolean> {
    const query: Query = {
      name: 'isFolderDescendantOrSelf',
      text: IS_FOLDER_DESCENDANT_OR_SELF,
      values: [folderSub, creatorSub, targetSub],
    };

    return this.exists(query);
  }

  async getRootFolders(creatorSub: string): Promise<GetRootFoldersRes[]> {
    const query: Query = {
      name: 'getRootFolders',
      text: GET_ROOT_FOLDERS,
      values: [creatorSub],
    };

    const res = await this.getItems<{
      sub: string;
      title: string;
      description: string;
      deskCount: string;
      childCount: string;
    }>(query);

    return res.map((item) => ({
      sub: item.sub,
      title: item.title,
      description: item.description,
      deskCount: Number(item.deskCount),
      folderCount: Number(item.childCount),
    }));
  }

  async updateDesk(params: {
    desk_sub: string;
    payload: { title: string; description: string; visibility?: DeskVisibility };
  }) {
    const query: Query = params.payload.visibility
      ? {
          name: 'updateDeskWithVisibility',
          text: UPDATE_DESK_WITH_VISIBILITY,
          values: [
            params.desk_sub,
            params.payload.title,
            params.payload.description,
            params.payload.visibility,
          ],
        }
      : {
          name: 'updateDesk',
          text: UPDATE_DESK,
          values: [params.desk_sub, params.payload.title, params.payload.description],
        };

    return this.updateItems(query);
  }

  async updateFeedSettings(params: {
    userSub: string;
    cardOrientation: CARD_ORIENTATION;
    studyMode: StudyMode;
  }) {
    const query: Query = {
      name: 'updateFeedSettings',
      text: UPDATE_FEED_SETTINGS,
      values: [params.cardOrientation, params.studyMode, params.userSub],
    };

    return this.updateItems(query);
  }

  async getCard(card_sub: string) {
    const query: Query = {
      name: 'getCard',
      text: GET_CARD,
      values: [card_sub],
    };

    return this.getItem<{
      sub: string;
      created_at: string;
      front_variants: string[];
      back_variants: string[];
      image_key: string | null;
      examples: string[];
    }>(query);
  }

  async updateImageKey(cardSub: string, imageKey: string | null): Promise<void> {
    const query: Query = {
      name: 'updateCardImageKey',
      text: `UPDATE cards.card SET image_key = $2 WHERE sub = $1`,
      values: [cardSub, imageKey],
    };

    await this.updateItems(query);
  }

  async countCardsWithImageKey(imageKey: string, excludeCardSub?: string): Promise<number> {
    const query: Query = {
      name: 'countCardsWithImageKey',
      text: `
        SELECT COUNT(*)::int AS count
        FROM cards.card
        WHERE image_key = $1
          AND ($2::uuid IS NULL OR sub != $2)
      `,
      values: [imageKey, excludeCardSub ?? null],
    };

    const result = await this.getItem<{ count: number }>(query);
    return result?.count ?? 0;
  }

  async updateCard(params: { card_sub: string; payload: { front: string[]; back: string[] } }) {
    const query: Query = {
      name: 'updateCard',
      text: UPDATE_CARD,
      values: [
        params.card_sub,
        JSON.stringify(params.payload.front),
        JSON.stringify(params.payload.back),
      ],
    };

    return this.updateItems(query);
  }

  async deleteCard(params: { cardSub: string }) {
    const query: Query = {
      name: 'deleteCard',
      text: DELETE_CARD,
      values: [params.cardSub],
    };

    return this.updateItems(query);
  }

  async archiveDesk(params: { desk_sub: string }) {
    const query: Query = {
      name: 'archiveDesk',
      text: ARCHIVE_DESK,
      values: [params.desk_sub],
    };

    return this.updateItems(query);
  }

  async restoreDesk(params: { desk_sub: string }) {
    const query: Query = {
      name: 'restoreDesk',
      text: RESTORE_DESK,
      values: [params.desk_sub],
    };

    return this.updateItems(query);
  }

  async updateDeskSettings(params: {
    desk_sub: string;
    payload: {
      cards_per_session: number;
      card_orientation: CARD_ORIENTATION;
      front_language: LanguageCode;
      back_language: LanguageCode;
      example_language: LanguageCode;
      study_mode: StudyMode;
    };
  }) {
    const query: Query = {
      name: 'updateDeskSettings',
      text: UPDATE_DESK_SETTINGS,
      values: [
        params.desk_sub,
        params.payload.cards_per_session,
        params.payload.card_orientation,
        params.payload.front_language,
        params.payload.back_language,
        params.payload.example_language,
        params.payload.study_mode,
      ],
    };

    return this.updateItems(query);
  }

  async getDeskSubByTitleInFolder(params: {
    title: string;
    folderSub: string;
    creatorSub: string;
  }) {
    const query: Query = {
      name: 'getDeskSubByTitleInFolder',
      text: GET_DESK_SUB_BY_TITLE_IN_FOLDER,
      values: [params.title, params.folderSub, params.creatorSub],
    };

    const result = await this.getItem<{ sub: string }>(query);
    return result?.sub ?? null;
  }

  async getDeskSubByTitleAtRoot(params: { title: string; creatorSub: string }) {
    const query: Query = {
      name: 'getDeskSubByTitleAtRoot',
      text: GET_DESK_SUB_BY_TITLE_AT_ROOT,
      values: [params.title, params.creatorSub],
    };

    const result = await this.getItem<{ sub: string }>(query);
    return result?.sub ?? null;
  }

  async deleteCardsByDeskSub(deskSub: string) {
    const query: Query = {
      name: 'deleteCardsByDeskSub',
      text: DELETE_CARDS_BY_DESK_SUB,
      values: [deskSub],
    };

    return this.updateItems(query);
  }

  async createCardCloneTx(
    tx: PgTransaction,
    card: {
      sub: string;
      deskSub: string;
      frontVariants: string[];
      backVariants: string[];
      imageKey?: string;
      copyOf: number;
    }
  ): Promise<void> {
    await tx.query({
      name: 'createCardCloneTx',
      text: `
        INSERT INTO cards.card
          (sub, desk_sub, front_variants, back_variants, image_key, copy_of)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      values: [
        card.sub,
        card.deskSub,
        JSON.stringify(card.frontVariants),
        JSON.stringify(card.backVariants),
        card.imageKey || null,
        card.copyOf,
      ],
    });
  }

  async insertDeskInTx(
    tx: PgTransaction,
    params: {
      sub: string;
      title: string;
      description: string;
      visibility?: DeskVisibility;
      creatorSub: string;
    }
  ): Promise<void> {
    const visibility = params.visibility ?? 'private';
    await tx.query({
      name: 'insertDeskInTx',
      text: INSERT_DESK,
      values: [
        params.sub,
        params.title,
        params.description,
        visibilityToLegacyPublic(visibility),
        visibility,
        params.creatorSub,
        false,
      ],
    });
  }

  async insertDeskSettingsCopyInTx(
    tx: PgTransaction,
    params: {
      deskSub: string;
      cardsPerSession: number;
      cardOrientation: CARD_ORIENTATION;
      frontLanguage: LanguageCode;
      backLanguage: LanguageCode;
      exampleLanguage: LanguageCode;
      studyMode: StudyMode;
    }
  ): Promise<void> {
    await tx.query({
      name: 'insertDeskSettingsCopyInTx',
      text: INSERT_DESK_SETTINGS_COPY,
      values: [
        params.deskSub,
        params.cardsPerSession,
        params.cardOrientation,
        params.frontLanguage,
        params.backLanguage,
        params.exampleLanguage,
        params.studyMode,
      ],
    });
  }

  async getDeskCardsForLibraryClone(deskSub: string) {
    const query: Query = {
      name: 'getDeskCardsForLibraryClone',
      text: GET_DESK_CARDS_FOR_LIBRARY_CLONE,
      values: [deskSub],
    };

    return this.getItems<{
      id: number;
      sub: string;
      front_variants: string[];
      back_variants: string[];
      image_key: string | null;
      examples: string[];
    }>(query);
  }

  async getCardsWithExamplesByDesk(deskSub: string) {
    const query: Query = {
      name: 'getCardsWithExamplesByDesk',
      text: GET_CARDS_WITH_EXAMPLES_BY_DESK,
      values: [deskSub],
    };

    return this.getItems<{
      sub: string;
      front_variants: string[];
      examples: string[];
    }>(query);
  }
}

export default new CardRepository();
