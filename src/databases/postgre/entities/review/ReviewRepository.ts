import { Query } from '../..';
import Table from '../Table';
import {
  ADD_DUE_CARDS_TO_BATCH,
  ADD_INBOX_CARDS_TO_BATCH,
  CREATE_BATCH,
  DELETE_BATCH,
  EXIST_RECENT_NOTIFICATION,
  GET_BATCH_CARD_COUNT,
  GET_BATCH_CARDS,
  GET_BATCH_CARDS_FOR_USER,
  MARK_BATCH_AS_NOTIFIED,
} from './ReviewRepositoryQueries';

export class ReviewRepository extends Table {
  async existRecentNotification(userSub: string) {
    const query: Query = {
      name: 'existRecentNotification',
      text: EXIST_RECENT_NOTIFICATION,
      values: [userSub],
    };

    return this.exists(query);
  }

  async createBatch(userSub: string): Promise<string | null> {
    const query: Query = {
      name: 'createBatch',
      text: CREATE_BATCH,
      values: [userSub],
    };

    return this.insertItem<string>(query, 'id');
  }

  async addDueCardsToBatch(batchId: string, userSub: string, limit: number): Promise<void> {
    const query: Query = {
      name: 'addDueCardsToBatch',
      text: ADD_DUE_CARDS_TO_BATCH,
      values: [batchId, userSub, limit],
    };

    await this.insertItem(query);
  }

  async addInboxCardsToBatch(batchId: string, userSub: string, limit: number): Promise<void> {
    const query: Query = {
      name: 'addInboxCardsToBatch',
      text: ADD_INBOX_CARDS_TO_BATCH,
      values: [batchId, userSub, limit],
    };

    await this.insertItem(query);
  }

  async markBatchAsNotified(batchId: string): Promise<void> {
    const query: Query = {
      name: 'markBatchAsNotified',
      text: MARK_BATCH_AS_NOTIFIED,
      values: [batchId],
    };

    await this.updateItems(query);
  }

  async deleteUnnotifiedBatch(batchId: string): Promise<void> {
    const query: Query = {
      name: 'deleteUnnotifiedBatch',
      text: DELETE_BATCH,
      values: [batchId],
    };

    await this.updateItems(query);
  }

  async getBatchCards(batchId: string): Promise<Array<{ card_sub: string }>> {
    const query: Query = {
      name: 'getBatchCards',
      text: GET_BATCH_CARDS,
      values: [batchId],
    };

    return this.getItems<{ card_sub: string }>(query);
  }

  async getBatchCardsForUser(
    batchId: string,
    userSub: string
  ): Promise<Array<{ card_sub: string }>> {
    const query: Query = {
      name: 'getBatchCardsForUser',
      text: GET_BATCH_CARDS_FOR_USER,
      values: [batchId, userSub],
    };

    return this.getItems<{ card_sub: string }>(query);
  }

  async getBatchCardCount(batchId: string): Promise<number> {
    const query: Query = {
      name: 'getBatchCardCount',
      text: GET_BATCH_CARD_COUNT,
      values: [batchId],
    };

    const row = await this.getItem<{ card_count: number }>(query);
    return row?.card_count ?? 0;
  }
}

export default new ReviewRepository();
