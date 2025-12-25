import Table from '../Table';
import { Query } from '../../index';
import { CARD_ORIENTATION } from '../../../../services/cards/card.const';
import { GET_DESK_SETTINGS_BY_SUB } from './DeskSettingsRepositoryQueries';

export class DeskSettingsRepository extends Table {
  async getByDeskSub(deskSub: string) {
    const query: Query = {
      name: 'getDeskSettingsByDeskSub',
      text: GET_DESK_SETTINGS_BY_SUB,
      values: [deskSub],
    };

    return this.getItem<{ cards_per_session: number; card_orientation: CARD_ORIENTATION }>(query);
  }
}

export default new DeskSettingsRepository();
