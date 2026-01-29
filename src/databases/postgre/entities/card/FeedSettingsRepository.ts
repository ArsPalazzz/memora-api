import Table from '../Table';
import { Query } from '../../index';
import {
  CREATE_FEED_SETTINGS,
  EXIST_FEED_SETTINGS_BY_USER_SUB,
  GET_FEED_SETTINGS_BY_USER_SUB,
} from './FeedSettingsRepositoryQueries';
import { CARD_ORIENTATION } from '../../../../services/cards/card.const';

export class FeedSettingsRepository extends Table {
  async create(userSub: string) {
    const query: Query = {
      name: 'createFeedSettings',
      text: CREATE_FEED_SETTINGS,
      values: [userSub],
    };

    return this.insertItem(query);
  }

  async existByUserSub(userSub: string) {
    const query: Query = {
      name: 'existFeedSettingsByUserSub',
      text: EXIST_FEED_SETTINGS_BY_USER_SUB,
      values: [userSub],
    };

    return this.exists(query);
  }

  async getByUserSub(userSub: string) {
    const query: Query = {
      name: 'getFeedSettingsByUserSub',
      text: GET_FEED_SETTINGS_BY_USER_SUB,
      values: [userSub],
    };

    return this.getItem<{ card_orientation: CARD_ORIENTATION }>(query);
  }
}

export default new FeedSettingsRepository();
