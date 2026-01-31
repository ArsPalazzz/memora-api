import { Query } from '../..';
import Table from '../Table';
import {
  ADD_CARDS_TO_BATCH,
  CREATE_BATCH,
  EXIST_RECENT_BATCH,
  GET_BATCH_CARDS,
  GET_BATCH_CARDS_FOR_USER,
  MARK_BATCH_AS_NOTIFIED,
} from './ReviewRepositoryQueries';

export class ReviewRepository extends Table {
  async existRecentBatch(userSub: string) {
    const query: Query = {
      name: 'getRecentBatches',
      text: EXIST_RECENT_BATCH,
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

  async addCardsToBatch(batchId: string, userSub: string, limit: number): Promise<void> {
    const query: Query = {
      name: 'addCardsToBatch',
      text: ADD_CARDS_TO_BATCH,
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
}

export default new ReviewRepository();
