import Table from '../Table';
import Postgres, { Query } from '../../index';
import {
  ARCHIVE_DESK,
  EXIST_CARD,
  EXIST_CARD_BY_SUB,
  EXIST_DESK,
  GET_CARDS,
  GET_CARDS_FOR_PLAY,
  GET_DESK_DETAILS,
  GET_DESKS,
  HAVE_ACCESS_TO_CARD,
  HAVE_ACCESS_TO_DESK,
  INSERT_CARD,
  INSERT_DESK,
  INSERT_DESK_SETTINGS,
  UPDATE_CARD,
  UPDATE_DESK,
  UPDATE_DESK_SETTINGS,
  UPDATE_LAST_TIME_PLAYED_DESK,
} from './CardRepositoryQueries';
import { GetDeskDetailsResult } from '../../../../services/cards/card.interfaces';
import { CARD_ORIENTATION } from '../../../../services/cards/card.const';

export class CardRepository extends Table {
  async getCards() {
    const query: Query = {
      name: 'getCards',
      text: GET_CARDS,
      values: [],
    };

    return this.getItems<any>(query);
  }

  async getCardsForPlay(deskSub: string, cards_per_session: number) {
    const query: Query = {
      name: 'getCardsForPlay',
      text: GET_CARDS_FOR_PLAY,
      values: [deskSub, cards_per_session],
    };

    return this.getItems<{ id: number; front_side: string; back_side: string }>(query);
  }

  async getDesks() {
    const query: Query = {
      name: 'getDesks',
      text: GET_DESKS,
      values: [],
    };

    return this.getItems<{ sub: string; title: string; description: string; created_at: string }>(
      query
    );
  }

  async getDeskDetails(params: { sub: string }) {
    const query: Query = {
      name: 'getDeskDetails',
      text: GET_DESK_DETAILS,
      values: [params.sub],
    };

    return this.getItem<GetDeskDetailsResult>(query);
  }

  async createCard(params: { sub: string; front: string; back: string; desk_sub: string }) {
    const query: Query = {
      name: 'createCard',
      text: INSERT_CARD,
      values: [params.desk_sub, params.front, params.back, params.sub],
    };

    return this.insertItem<number>(query);
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

  async updateLastTimePlayedDesk(deskSub: string) {
    const query: Query = {
      name: 'updateLastTimePlayedDesk',
      text: UPDATE_LAST_TIME_PLAYED_DESK,
      values: [deskSub],
    };

    return this.updateItems(query);
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
    creatorSub: string;
  }) {
    const tx = await this.startTransaction();

    try {
      const desk = await tx.query({
        name: 'insertDesk',
        text: INSERT_DESK,
        values: [params.sub, params.title, params.description, params.creatorSub],
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

  async updateCard(params: { card_sub: string; payload: { front: string; back: string } }) {
    const query: Query = {
      name: 'updateCard',
      text: UPDATE_CARD,
      values: [params.card_sub, params.payload.front, params.payload.back],
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
