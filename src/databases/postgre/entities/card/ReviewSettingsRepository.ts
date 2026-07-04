import Table from '../Table';
import { Query } from '../../index';
import {
  CREATE_REVIEW_SETTINGS,
  EXIST_REVIEW_SETTINGS_BY_USER_SUB,
  GET_REVIEW_SETTINGS_BY_USER_SUB,
  UPDATE_REVIEW_SETTINGS,
} from './ReviewSettingsRepositoryQueries';
import { StudyMode } from '../../../../services/games/studyMode.const';

export class ReviewSettingsRepository extends Table {
  async create(userSub: string) {
    const query: Query = {
      name: 'createReviewSettings',
      text: CREATE_REVIEW_SETTINGS,
      values: [userSub],
    };

    return this.insertItem(query);
  }

  async existByUserSub(userSub: string) {
    const query: Query = {
      name: 'existReviewSettingsByUserSub',
      text: EXIST_REVIEW_SETTINGS_BY_USER_SUB,
      values: [userSub],
    };

    return this.exists(query);
  }

  async getByUserSub(userSub: string) {
    const query: Query = {
      name: 'getReviewSettingsByUserSub',
      text: GET_REVIEW_SETTINGS_BY_USER_SUB,
      values: [userSub],
    };

    return this.getItem<{ cards_per_session: number; study_mode: StudyMode }>(query);
  }

  async updateReviewSettings(params: {
    userSub: string;
    cards_per_session: number;
    study_mode: StudyMode;
  }) {
    const query: Query = {
      name: 'updateReviewSettings',
      text: UPDATE_REVIEW_SETTINGS,
      values: [params.cards_per_session, params.study_mode, params.userSub],
    };

    return this.updateItems(query);
  }
}

export default new ReviewSettingsRepository();
