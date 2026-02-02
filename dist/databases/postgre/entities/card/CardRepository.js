'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.CardRepository = void 0;
const Table_1 = __importDefault(require('../Table'));
const CardRepositoryQueries_1 = require('./CardRepositoryQueries');
class CardRepository extends Table_1.default {
  async getCards() {
    const query = {
      name: 'getCards',
      text: CardRepositoryQueries_1.GET_CARDS,
      values: [],
    };
    return this.getItems(query);
  }
  async getCardBySub(cardSub) {
    const query = {
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
    return this.getItem(query);
  }
  async create(params) {
    const { sub, deskSub, frontVariants, backVariants, imageUuid, copyOf } = params;

    const query = {
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
  async getCardSubsForPlay(deskSub, cardsPerSession) {
    const query = {
      name: 'getCardSubsForPlay',
      text: CardRepositoryQueries_1.GET_CARD_SUBS_FOR_PLAY,
      values: [deskSub, cardsPerSession],
    };
    return this.getItems(query);
  }
  async getDesksByCreatorSub(userSub) {
    const query = {
      name: 'getDesksByCreatorSub',
      text: CardRepositoryQueries_1.GET_DESKS_BY_CREATOR_SUB,
      values: [userSub],
    };
    const result = await this.getItems(query);
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
  async getArchivedDesksByCreatorSub(userSub) {
    const query = {
      name: 'getArchivedDesksByCreatorSub',
      text: CardRepositoryQueries_1.GET_ARCHIVED_DESKS_BY_CREATOR_SUB,
      values: [userSub],
    };
    const result = await this.getItems(query);
    return result.map((item) => ({
      ...item,
      totalCards: parseInt(item.totalCards, 10) || 0,
      newCards: parseInt(item.newCards, 10) || 0,
      dueCards: parseInt(item.dueCards, 10) || 0,
      learningCards: parseInt(item.learningCards, 10) || 0,
      masteredCards: parseInt(item.masteredCards, 10) || 0,
    }));
  }
  async getDeskShortByCreatorSub(userSub) {
    const query = {
      name: 'getDeskSubsByCreatorSub',
      text: CardRepositoryQueries_1.GET_DESK_SUBS_BY_CREATOR_SUB,
      values: [userSub],
    };
    return await this.getItems(query);
  }
  async getDeskDetails(params) {
    const query = {
      name: 'getDeskDetails',
      text: CardRepositoryQueries_1.GET_DESK_DETAILS,
      values: [params.deskSub, params.userSub],
    };
    return this.getItem(query);
  }
  async getDeskCards(params) {
    const query = {
      name: 'getDeskCards',
      text: CardRepositoryQueries_1.GET_DESK_CARDS,
      values: [params.deskSub],
    };
    return this.getItems(query);
  }
  async isDeskOwner(userSub, deskSub) {
    const query = {
      name: 'isDeskOwner',
      text: `
        SELECT EXISTS (
          SELECT 1 FROM cards.desk 
          WHERE sub = $1 AND creator_sub = $2
        ) as exists
      `,
      values: [deskSub, userSub],
    };
    const result = await this.getItem(query);
    return result?.exists || false;
  }
  async getUserDesks(userSub) {
    const query = {
      name: 'getUserDesks',
      text: `
        SELECT sub, title 
        FROM cards.desk 
        WHERE creator_sub = $1 AND status = 'active'
        ORDER BY created_at DESC
      `,
      values: [userSub],
    };
    return this.getItems(query);
  }
  async createCard(params) {
    const query = {
      name: 'createCard',
      text: CardRepositoryQueries_1.INSERT_CARD,
      values: [
        params.desk_sub,
        JSON.stringify(params.front),
        JSON.stringify(params.back),
        params.sub,
      ],
    };
    return this.insertItem(query, 'sub');
  }
  async existCard(params) {
    const query = {
      name: 'existCard',
      text: CardRepositoryQueries_1.EXIST_CARD,
      values: [params.id],
    };
    return this.exists(query);
  }
  async existCardBySub(params) {
    const query = {
      name: 'existCardBySub',
      text: CardRepositoryQueries_1.EXIST_CARD_BY_SUB,
      values: [params.sub],
    };
    return this.exists(query);
  }
  async existDesk(params) {
    const query = {
      name: 'existDesk',
      text: CardRepositoryQueries_1.EXIST_DESK,
      values: [params.sub],
    };
    return this.exists(query);
  }
  async existDeskWithTitle(params) {
    const query = {
      name: 'existDeskWithTitle',
      text: CardRepositoryQueries_1.EXIST_DESK_WITH_THIS_TITLE,
      values: [params.title, params.creatorSub],
    };
    return this.exists(query);
  }
  async existDeskWithTitleAndFolder(params) {
    const query = {
      name: 'existDeskWithTitleAndFolder',
      text: CardRepositoryQueries_1.EXIST_DESK_WITH_THIS_TITLE_AND_FOLDER,
      values: [params.title, params.folderSub, params.creatorSub],
    };
    return this.exists(query);
  }
  async existFolderWithTitleAndParent(params) {
    const query = {
      name: 'existFolderWithTitleAndParent',
      text: CardRepositoryQueries_1.EXIST_FOLDER_WITH_THIS_TITLE_AND_PARENT,
      values: [params.title, params.folderSub, params.creatorSub],
    };
    return this.exists(query);
  }
  async existFolderWithTitle(params) {
    const query = {
      name: 'existFolderWithTitle',
      text: CardRepositoryQueries_1.EXIST_FOLDER_WITH_THIS_TITLE,
      values: [params.title, params.creatorSub],
    };
    return this.exists(query);
  }
  async updateLastTimePlayedDesk(deskSub, tx) {
    return tx.query({
      name: 'updateLastTimePlayedDesk',
      text: CardRepositoryQueries_1.UPDATE_LAST_TIME_PLAYED_DESK,
      values: [deskSub],
    });
  }
  async haveAccessToDesk(params) {
    const query = {
      name: 'haveAccessToDesk',
      text: CardRepositoryQueries_1.HAVE_ACCESS_TO_DESK,
      values: [params.desk_sub, params.user_sub],
    };
    return this.exists(query);
  }
  async haveAccessToCard(params) {
    const query = {
      name: 'haveAccessToCard',
      text: CardRepositoryQueries_1.HAVE_ACCESS_TO_CARD,
      values: [params.card_sub, params.user_sub],
    };
    return this.exists(query);
  }
  async createDesk(params) {
    const tx = await this.startTransaction();
    try {
      const desk = await tx.query({
        name: 'insertDesk',
        text: CardRepositoryQueries_1.INSERT_DESK,
        values: [params.sub, params.title, params.description, params.public, params.creatorSub],
      });
      await tx.query({
        name: 'insertDeskSettings',
        text: CardRepositoryQueries_1.INSERT_DESK_SETTINGS,
        values: [params.sub],
      });
      await tx.commit();
      return desk.rows[0].created_at;
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }
  async createFolder(params) {
    const query = {
      name: 'insertFolder',
      text: CardRepositoryQueries_1.INSERT_FOLDER,
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
  async existFolderBySub(sub) {
    const query = {
      name: 'existFolderBySub',
      text: CardRepositoryQueries_1.EXIST_FOLDER_BY_SUB,
      values: [sub],
    };
    return this.exists(query);
  }
  async addDeskToFolder(deskSub, folderSub) {
    const query = {
      name: 'addDeskToFolder',
      text: CardRepositoryQueries_1.ADD_DESK_TO_FOLDER,
      values: [folderSub, deskSub],
    };
    return this.insertItem(query);
  }
  async haveAccessToFolder(folderSub, userSub) {
    const query = {
      name: 'haveAccessToFolder',
      text: CardRepositoryQueries_1.HAVE_ACCESS_TO_FOLDER,
      values: [folderSub, userSub],
    };
    return this.exists(query);
  }
  async getFolders(creatorSub) {
    const query = {
      name: 'getFoldersByCreatorSub',
      text: CardRepositoryQueries_1.GET_FOLDER_TREE,
      values: [creatorSub],
    };
    return await this.getItems(query);
  }
  async getFolderContents(folderSub, creatorSub) {
    const query = {
      name: 'getFolderContents',
      text: CardRepositoryQueries_1.GET_FOLDER_CONTENTS,
      values: [folderSub, creatorSub],
    };
    const res = await this.getItems(query);
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
  async getFolderInfo(folderSub) {
    const query = {
      name: 'getFolderInfo',
      text: CardRepositoryQueries_1.GET_FOLDER_INFO,
      values: [folderSub],
    };
    const result = await this.getItem(query);
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
  async getRootFolders(creatorSub) {
    const query = {
      name: 'getRootFolders',
      text: CardRepositoryQueries_1.GET_ROOT_FOLDERS,
      values: [creatorSub],
    };
    const res = await this.getItems(query);

    return res.map((item) => ({
      sub: item.sub,
      title: item.title,
      description: item.description,
      deskCount: Number(item.deskCount),
      folderCount: Number(item.childCount),
    }));
  }
  async updateDesk(params) {
    const query = {
      name: 'updateDesk',
      text: CardRepositoryQueries_1.UPDATE_DESK,
      values: [params.desk_sub, params.payload.title, params.payload.description],
    };
    return this.updateItems(query);
  }
  async updateFeedCardOrientation(params) {
    const query = {
      name: 'updateFeedCardOrientation',
      text: CardRepositoryQueries_1.UPDATE_FEED_CARD_ORIENTATION,
      values: [params.cardOrientation, params.userSub],
    };
    return this.updateItems(query);
  }
  async getCard(card_sub) {
    const query = {
      name: 'getCard',
      text: CardRepositoryQueries_1.GET_CARD,
      values: [card_sub],
    };
    return this.getItem(query);
  }
  async updateCard(params) {
    const query = {
      name: 'updateCard',
      text: CardRepositoryQueries_1.UPDATE_CARD,
      values: [
        params.card_sub,
        JSON.stringify(params.payload.front),
        JSON.stringify(params.payload.back),
      ],
    };
    return this.updateItems(query);
  }
  async deleteCard(params) {
    const query = {
      name: 'deleteCard',
      text: CardRepositoryQueries_1.DELETE_CARD,
      values: [params.cardSub],
    };
    return this.updateItems(query);
  }
  async archiveDesk(params) {
    const query = {
      name: 'archiveDesk',
      text: CardRepositoryQueries_1.ARCHIVE_DESK,
      values: [params.desk_sub],
    };
    return this.updateItems(query);
  }
  async restoreDesk(params) {
    const query = {
      name: 'restoreDesk',
      text: CardRepositoryQueries_1.RESTORE_DESK,
      values: [params.desk_sub],
    };
    return this.updateItems(query);
  }
  async updateDeskSettings(params) {
    const query = {
      name: 'updateDeskSettings',
      text: CardRepositoryQueries_1.UPDATE_DESK_SETTINGS,
      values: [params.desk_sub, params.payload.cards_per_session, params.payload.card_orientation],
    };
    return this.updateItems(query);
  }
}
exports.CardRepository = CardRepository;
exports.default = new CardRepository();
