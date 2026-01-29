"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSessionRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const GameSessionRepositoryQueries_1 = require("./GameSessionRepositoryQueries");
class GameSessionRepository extends Table_1.default {
    async create(sessionId, userSub, deskSub, tx) {
        tx.query({
            name: 'createGameSession',
            text: GameSessionRepositoryQueries_1.CREATE_GAME_SESSION,
            values: [sessionId, userSub, deskSub],
        });
    }
    async getShownCards(sessionId) {
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
        const result = await this.getItems(query);
        return result.map((row) => row.card_sub);
    }
    async recordCardShown(sessionId, cardSub) {
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
    async createReview(sessionId, userSub, batchId, tx) {
        tx.query({
            name: 'createReviewSession',
            text: GameSessionRepositoryQueries_1.CREATE_REVIEW_SESSION,
            values: [sessionId, userSub, batchId],
        });
    }
    async haveAccessToSession(sessionId, userSub) {
        const query = {
            name: 'haveAccessToSession',
            text: GameSessionRepositoryQueries_1.HAVE_ACCESS_TO_SESSION,
            values: [sessionId, userSub],
        };
        return this.exists(query);
    }
    async createFeed(sessionId, userSub) {
        const query = {
            name: 'createFeedSession',
            text: GameSessionRepositoryQueries_1.CREATE_FEED_SESSION,
            values: [sessionId, userSub],
        };
        return this.insertItem(query);
    }
    async existBySessionId(sessionId) {
        const query = {
            name: 'existBySessionId',
            text: GameSessionRepositoryQueries_1.EXIST_BY_SESSION_ID,
            values: [sessionId],
        };
        return this.exists(query);
    }
    async isActive(sessionId) {
        const query = {
            name: 'isSessionActive',
            text: GameSessionRepositoryQueries_1.IS_SESSION_ACTIVE,
            values: [sessionId],
        };
        return this.exists(query);
    }
    async getWeeklyDeskStats(userSub, deskSub) {
        const query = {
            name: 'getWeeklyDeskStats',
            text: GameSessionRepositoryQueries_1.GET_WEEKLY_DESK_STATS,
            values: [userSub, deskSub],
        };
        const res = await this.getItem(query);
        return res?.weekly_attempts || undefined;
    }
    async finish(sessionId) {
        const query = {
            name: 'finishSession',
            text: GameSessionRepositoryQueries_1.FINISH_SESSION,
            values: [sessionId],
        };
        return this.updateItems(query);
    }
    async getNextUnansweredCard(params) {
        const query = {
            name: 'getNextUnansweredCard',
            text: GameSessionRepositoryQueries_1.GET_NEXT_UNANSWERED_CARD,
            values: [params.sessionId, params.userSub],
        };
        return this.getItem(query);
    }
    async saveAnswer(params) {
        const query = {
            name: 'saveAnswer',
            text: GameSessionRepositoryQueries_1.SAVE_ANSWER,
            values: [params.answer, params.isCorrect, params.sessionCardId],
        };
        await this.updateItems(query);
    }
    async hasUnansweredCards(sessionId) {
        const query = {
            name: 'hasUnansweredCards',
            text: GameSessionRepositoryQueries_1.HAS_UNANSWERED_CARDS,
            values: [sessionId],
        };
        return this.exists(query);
    }
}
exports.GameSessionRepository = GameSessionRepository;
exports.default = new GameSessionRepository();
