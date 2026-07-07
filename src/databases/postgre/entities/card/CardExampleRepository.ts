import Table, { PgTransaction } from '../Table';
import { Query } from '../../index';
import { DELETE_CARD_EXAMPLES, INSERT_CARD_EXAMPLES } from './CardExampleRepositoryQueries';

export class CardExampleRepository extends Table {
  async deleteByCardSub(cardSub: string) {
    const query: Query = {
      name: 'deleteCardExamplesByCardSub',
      text: DELETE_CARD_EXAMPLES,
      values: [cardSub],
    };

    return this.updateItems(query);
  }

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

  async createManyTx(
    tx: PgTransaction,
    params: { cardSub: string; sentences: string[] }
  ): Promise<void> {
    if (!params.sentences.length) return;

    await tx.query({
      name: 'createCardExamplesTx',
      text: INSERT_CARD_EXAMPLES(params.sentences.length),
      values: [params.cardSub, ...params.sentences],
    });
  }
}

export default new CardExampleRepository();
