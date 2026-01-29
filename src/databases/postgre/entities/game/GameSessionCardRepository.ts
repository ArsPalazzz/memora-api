import { Query } from '../..';
import Table, { PgTransaction } from '../Table';
import {
  CREATE_GAME_SESSION_CARD,
  GET_LAST_ANSWERED_CARD,
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

  async createWithoutTx(sessionId: string, cardSub: string, direction: string) {
    const query: Query = {
      name: 'createGameSessionCard',
      text: CREATE_GAME_SESSION_CARD,
      values: [sessionId, cardSub, direction],
    };

    await this.insertItem(query);
  }

  async getNextInSessionCard(sessionId: string) {
    const query: Query = {
      name: 'getNextInSessionCard',
      text: GET_NEXT_IN_SESSION_CARD,
      values: [sessionId],
    };

    return this.getItem<{ sub: string; text: string[] }>(query);
  }

  async createFeedAction(params: {
    sessionId: string;
    cardSub: string;
    action: 'like' | 'skip' | 'answer';
    deskSub?: string;
  }) {
    const { sessionId, cardSub, action, deskSub } = params;

    const query = `
      INSERT INTO games.session_card 
        (session_id, card_sub, direction, user_answer, is_correct, answered_at)
      VALUES ($1, $2, 'back_to_front', $3, NULL, NOW())
    `;

    const userAnswer = action === 'like' ? 'liked' : action === 'answer' ? 'answered' : 'skipped';

    return this.updateItems({
      name: 'createFeedAction',
      text: query,
      values: [sessionId, cardSub, userAnswer],
    });
  }

  async getLastAnsweredCard(sessionId: string) {
    const query: Query = {
      name: 'getLastAnsweredCard',
      text: GET_LAST_ANSWERED_CARD,
      values: [sessionId],
    };

    return this.getItem<{ cardSub: string; quality: number }>(query);
  }
}

export default new GameSessionCardRepository();
