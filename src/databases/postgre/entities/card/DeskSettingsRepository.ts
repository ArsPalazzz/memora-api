import Table from '../Table';
import { Query } from '../../index';
import { CARD_ORIENTATION, LanguageCode } from '../../../../services/cards/card.const';
import { GET_DESK_SETTINGS_BY_SUB } from './DeskSettingsRepositoryQueries';

export class DeskSettingsRepository extends Table {
  async getByDeskSub(deskSub: string) {
    const query: Query = {
      name: 'getDeskSettingsByDeskSub',
      text: GET_DESK_SETTINGS_BY_SUB,
      values: [deskSub],
    };

    return this.getItem<{
      cards_per_session: number;
      card_orientation: CARD_ORIENTATION;
      front_language: LanguageCode;
      back_language: LanguageCode;
      example_language: LanguageCode;
    }>(query);
  }
}

export default new DeskSettingsRepository();
