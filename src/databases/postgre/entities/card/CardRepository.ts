import Table, { PgTransaction } from '../Table';
import Postgres, { Query } from '../../index';
import {
  ARCHIVE_DESK,
  DELETE_CARD,
  EXIST_CARD,
  EXIST_CARD_BY_SUB,
  EXIST_DESK,
  GET_CARD_SUBS_FOR_PLAY,
  GET_CARDS,
  GET_DESK_DETAILS,
  GET_DESK_SUBS_BY_CREATOR_SUB,
  GET_DESKS_BY_CREATOR_SUB,
  HAVE_ACCESS_TO_CARD,
  HAVE_ACCESS_TO_DESK,
  INSERT_CARD,
  INSERT_DESK,
  INSERT_DESK_SETTINGS,
  UPDATE_CARD,
  UPDATE_DESK,
  UPDATE_DESK_SETTINGS,
  UPDATE_FEED_CARD_ORIENTATION,
  UPDATE_LAST_TIME_PLAYED_DESK,
} from './CardRepositoryQueries';
import { GetDeskDetailsResult } from '../../../../services/cards/card.interfaces';
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
