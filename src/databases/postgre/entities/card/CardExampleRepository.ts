import Table from '../Table';
import { Query } from '../../index';
import { INSERT_CARD_EXAMPLES } from './CardExampleRepositoryQueries';

export class CardExampleRepository extends Table {
  async createMany(params: { cardSub: string; sentences: string[] }) {
    if (!params.sentences.length) return [];

    const queryText = INSERT_CARD_EXAMPLES(params.sentences.length);

    const values = [params.cardSub, ...params.sentences];

    const query: Query = {
      name: 'createCardExamples',
      text: queryText,
      values: values,
    };

    return this.insertItem<number>(query);
  }
}

export default new CardExampleRepository();
