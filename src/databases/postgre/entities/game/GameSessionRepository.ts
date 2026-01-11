import Table, { PgTransaction } from '../Table';
import { Query } from '../../index';
import {
  CREATE_GAME_SESSION,
  CREATE_REVIEW_SESSION,
  EXIST_BY_SESSION_ID,
  FINISH_SESSION,
  GET_NEXT_UNANSWERED_CARD,
  HAS_UNANSWERED_CARDS,
  HAVE_ACCESS_TO_SESSION,
  IS_SESSION_ACTIVE,
  SAVE_ANSWER,
} from './GameSessionRepositoryQueries';

export class GameSessionRepository extends Table {
  async create(sessionId: string, userSub: string, deskSub: string, tx: PgTransaction) {
    tx.query({
      name: 'createGameSession',
      text: CREATE_GAME_SESSION,
      values: [sessionId, userSub, deskSub],
    });
  }

  async createReview(sessionId: string, userSub: string, batchId: string, tx: PgTransaction) {
    tx.query({
      name: 'createReviewSession',
      text: CREATE_REVIEW_SESSION,
      values: [sessionId, userSub, batchId],
    });
  }

  async haveAccessToSession(sessionId: string, userSub: string) {
    const query: Query = {
      name: 'haveAccessToSession',
      text: HAVE_ACCESS_TO_SESSION,
      values: [sessionId, userSub],
    };

    return this.exists(query);
  }

  async existBySessionId(sessionId: string) {
    const query: Query = {
      name: 'existBySessionId',
      text: EXIST_BY_SESSION_ID,
      values: [sessionId],
    };

    return this.exists(query);
  }

  async isActive(sessionId: string) {
    const query: Query = {
      name: 'isSessionActive',
      text: IS_SESSION_ACTIVE,
      values: [sessionId],
    };

    return this.exists(query);
  }

  async finish(sessionId: string) {
    const query: Query = {
      name: 'finishSession',
      text: FINISH_SESSION,
      values: [sessionId],
    };

    return this.updateItems(query);
  }

  async getNextUnansweredCard(params: { sessionId: string; userSub: string }) {
    const query: Query = {
      name: 'getNextUnansweredCard',
      text: GET_NEXT_UNANSWERED_CARD,
      values: [params.sessionId, params.userSub],
    };

    return this.getItem<{
      sessionCardId: number;
      cardSub: string;
      direction: string;
      frontVariants: string[];
      backVariants: string[];
    }>(query);
  }

  async saveAnswer(params: { sessionCardId: number; answer: string; isCorrect: boolean }) {
    const query: Query = {
      name: 'saveAnswer',
      text: SAVE_ANSWER,
      values: [params.answer, params.isCorrect, params.sessionCardId],
    };

    await this.updateItems(query);
  }

  async hasUnansweredCards(sessionId: string) {
    const query: Query = {
      name: 'hasUnansweredCards',
      text: HAS_UNANSWERED_CARDS,
      values: [sessionId],
    };

    return this.exists(query);
  }
}

export default new GameSessionRepository();
