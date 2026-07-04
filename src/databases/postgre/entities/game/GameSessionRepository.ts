import Table, { PgTransaction } from '../Table';
import { Query } from '../../index';
import {
  CREATE_GAME_SESSION,
  CREATE_REVIEW_SESSION,
  CREATE_FEED_SESSION,
  GET_SESSION_MODE,
  EXIST_BY_SESSION_ID,
  FINISH_SESSION,
  GET_NEXT_UNANSWERED_CARD,
  GET_WEEKLY_DESK_STATS,
  HAS_UNANSWERED_CARDS,
  HAVE_ACCESS_TO_SESSION,
  IS_SESSION_ACTIVE,
  SAVE_ANSWER,
  SAVE_REVEAL,
  GET_CARD_IN_SESSION_BY_SUB,
} from './GameSessionRepositoryQueries';
import { GetWeeklyDeskStats } from '../../../../services/games/game.interfaces';
import { StudyMode } from '../../../../services/games/studyMode.const';

export class GameSessionRepository extends Table {
  async create(
    sessionId: string,
    userSub: string,
    deskSub: string,
    mode: StudyMode,
    tx: PgTransaction
  ) {
    tx.query({
      name: 'createGameSession',
      text: CREATE_GAME_SESSION,
      values: [sessionId, userSub, mode, deskSub],
    });
  }

  async getShownCards(sessionId: string): Promise<string[]> {
    const query = {
      name: 'getShownCards',
      text: `
      SELECT card_sub 
      FROM games.session_shown_cards 
      WHERE session_id = $1
      ORDER BY shown_at DESC
      LIMIT 100
    `,
      values: [sessionId],
    };

    const result = await this.getItems<{ card_sub: string }>(query);
    return result.map((row) => row.card_sub);
  }

  async recordCardShown(sessionId: string, cardSub: string): Promise<void> {
    const query = {
      name: 'recordCardShown',
      text: `
      INSERT INTO games.session_shown_cards (session_id, card_sub, shown_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (session_id, card_sub) DO UPDATE 
      SET shown_at = NOW()
    `,
      values: [sessionId, cardSub],
    };

    await this.insertItem(query);
  }

  async createReview(
    sessionId: string,
    userSub: string,
    batchId: string,
    mode: StudyMode,
    tx: PgTransaction
  ) {
    tx.query({
      name: 'createReviewSession',
      text: CREATE_REVIEW_SESSION,
      values: [sessionId, userSub, mode, batchId],
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

  async createFeed(sessionId: string, userSub: string, mode: StudyMode) {
    const query: Query = {
      name: 'createFeedSession',
      text: CREATE_FEED_SESSION,
      values: [sessionId, userSub, mode],
    };

    return this.insertItem(query);
  }

  async getSessionMode(sessionId: string): Promise<StudyMode | null> {
    const query: Query = {
      name: 'getSessionMode',
      text: GET_SESSION_MODE,
      values: [sessionId],
    };

    const result = await this.getItem<{ mode: StudyMode }>(query);
    return result?.mode ?? null;
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

  async getWeeklyDeskStats(userSub: string, deskSub: string) {
    const query: Query = {
      name: 'getWeeklyDeskStats',
      text: GET_WEEKLY_DESK_STATS,
      values: [userSub, deskSub],
    };

    const res = await this.getItem<GetWeeklyDeskStats>(query);

    return res?.weekly_attempts || undefined;
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
      examples: string[];
    }>(query);
  }

  async saveReveal(params: { sessionCardId: number }) {
    const query: Query = {
      name: 'saveReveal',
      text: SAVE_REVEAL,
      values: [params.sessionCardId],
    };

    await this.updateItems(query);
  }

  async getCardInSessionBySub(params: { sessionId: string; userSub: string; cardSub: string }) {
    const query: Query = {
      name: 'getCardInSessionBySub',
      text: GET_CARD_IN_SESSION_BY_SUB,
      values: [params.sessionId, params.userSub, params.cardSub],
    };

    return this.getItem<{
      sessionCardId: number;
      cardSub: string;
      direction: string;
      frontVariants: string[];
      backVariants: string[];
      examples: string[];
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
