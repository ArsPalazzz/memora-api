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
  GET_FOLDER_CONTENTS,
  GET_FOLDER_INFO,
  GET_FOLDER_TREE,
  GET_ROOT_FOLDERS,
  HAVE_ACCESS_TO_CARD,
  HAVE_ACCESS_TO_DESK,
  HAVE_ACCESS_TO_FOLDER,
  INSERT_CARD,
  INSERT_DESK,
  INSERT_DESK_SETTINGS,
  INSERT_FOLDER,
  RESTORE_DESK,
  UPDATE_CARD,
  UPDATE_DESK,
  UPDATE_DESK_SETTINGS,
  UPDATE_FEED_CARD_ORIENTATION,
  UPDATE_LAST_TIME_PLAYED_DESK,
} from './CardRepositoryQueries';
import {
  Folder,
  FolderContentItem,
  FolderInfo,
  GetDeskCardsResult,
  GetDeskDetailsResult,
  GetFolderContentsRes,
  GetRootFoldersRes,
} from '../../../../services/cards/card.interfaces';
import { CARD_ORIENTATION } from '../../../../services/cards/card.const';
import { DatabaseError } from '../../../../exceptions';

interface CreateCardParams {
  sub: string;
  deskSub: string;
  frontVariants: string[];
  backVariants: string[];
  imageUuid?: string;
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
          image_uuid
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
      image_uuid?: string;
    }>(query);
  }

  async create(params: CreateCardParams) {
    const { sub, deskSub, frontVariants, backVariants, imageUuid, copyOf } = params;
    console.log(params);
    const query: Query = {
      name: 'createCard',
      text: `
        INSERT INTO cards.card 
          (sub, desk_sub, front_variants, back_variants, image_uuid, copy_of, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      values: [
        sub,
        deskSub,
        JSON.stringify(frontVariants),
        JSON.stringify(backVariants),
        imageUuid,
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
      }));
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

    return await this.getItems<{ sub: string; title: string }>(query);
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

  async existDeskWithTitle(params: { title: string; creatorSub: string }) {
    const query: Query = {
      name: 'existDeskWithTitle',
      text: EXIST_DESK_WITH_THIS_TITLE,
      values: [params.title, params.creatorSub],
    };

    return this.exists(query);
  }

  async existDeskWithTitleAndFolder(params: {
    title: string;
    folderSub: string;
    creatorSub: string;
  }) {
    const query: Query = {
      name: 'existDeskWithTitleAndFolder',
      text: EXIST_DESK_WITH_THIS_TITLE_AND_FOLDER,
      values: [params.title, params.folderSub, params.creatorSub],
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
    public: boolean;
    creatorSub: string;
  }) {
    const tx = await this.startTransaction();

    try {
      const desk = await tx.query({
        name: 'insertDesk',
        text: INSERT_DESK,
        values: [params.sub, params.title, params.description, params.public, params.creatorSub],
      });

      await tx.query({
        name: 'insertDeskSettings',
        text: INSERT_DESK_SETTINGS,
        values: [params.sub],
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
    console.log(res);

    return res.map((item) => ({
      sub: item.sub,
      title: item.title,
      description: item.description,
      deskCount: Number(item.deskCount),
      folderCount: Number(item.childCount),
    }));
  }

  async updateDesk(params: { desk_sub: string; payload: { title: string; description: string } }) {
    const query: Query = {
      name: 'updateDesk',
      text: UPDATE_DESK,
      values: [params.desk_sub, params.payload.title, params.payload.description],
    };

    return this.updateItems(query);
  }

  async updateFeedCardOrientation(params: { userSub: string; cardOrientation: CARD_ORIENTATION }) {
    const query: Query = {
      name: 'updateFeedCardOrientation',
      text: UPDATE_FEED_CARD_ORIENTATION,
      values: [params.cardOrientation, params.userSub],
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
      examples: string[];
    }>(query);
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
    payload: { cards_per_session: number; card_orientation: CARD_ORIENTATION };
  }) {
    const query: Query = {
      name: 'updateDeskSettings',
      text: UPDATE_DESK_SETTINGS,
      values: [params.desk_sub, params.payload.cards_per_session, params.payload.card_orientation],
    };

    return this.updateItems(query);
  }
}

export default new CardRepository();
