import { Query } from '../..';
import Table from '../Table';
import {
  DEACTIVATE_TOKEN,
  EXIST_TOKEN,
  GET_ACTIVE_FCM_TOKENS,
  INSERT_TOKEN,
  LIMIT_USER_TOKENS,
} from './NotificationRepositoryQueries';

export class NotificationRepository extends Table {
  async insertToken(userSub: string, token: string, deviceInfo: object) {
    const query: Query = {
      name: 'insertToken',
      text: INSERT_TOKEN,
      values: [userSub, token, deviceInfo],
    };

    return this.insertItem<{ id: number }>(query);
  }

  async existToken(token: string): Promise<boolean> {
    const query: Query = {
      name: 'existToken',
      text: EXIST_TOKEN,
      values: [token],
    };

    return this.exists(query);
  }

  async deactivateToken(token: string, reason: string): Promise<void> {
    const query: Query = {
      name: 'deactivateToken',
      text: DEACTIVATE_TOKEN,
      values: [token, reason],
    };
    await this.updateItems(query);
  }

  async getActiveFcmTokens(userSub: string): Promise<{ token: string }[]> {
    const query: Query = {
      name: 'getActiveFcmTokens',
      text: GET_ACTIVE_FCM_TOKENS,
      values: [userSub],
    };

    return this.getItems<{ token: string }>(query);
  }

  async limitUserTokens(userSub: string, maxTokens: number): Promise<void> {
    const query: Query = {
      name: 'limitUserTokens',
      text: LIMIT_USER_TOKENS,
      values: [userSub, maxTokens],
    };
    await this.updateItems(query);
  }
}

export default new NotificationRepository();
