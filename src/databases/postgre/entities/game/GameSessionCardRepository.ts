import { Query } from '../..';
import Table, { PgTransaction } from '../Table';
import {
  CREATE_GAME_SESSION_CARD,
  GET_NEXT_IN_SESSION_CARD,
} from './GameSessionCardRepositoryQueries';

export class GameSessionCardRepository extends Table {
  async create(sessionId: string, cardSub: string, direction: string, tx: PgTransaction) {
    return tx.query({
      name: 'createGameSessionCard',
      text: CREATE_GAME_SESSION_CARD,
      values: [sessionId, cardSub, direction],
    });
  }

  async getNextInSessionCard(sessionId: string) {
    const query: Query = {
      name: 'getNextInSessionCard',
      text: GET_NEXT_IN_SESSION_CARD,
      values: [sessionId],
    };

    return this.getItem<{ sub: string; text: string[] }>(query);
  }
}

export default new GameSessionCardRepository();
