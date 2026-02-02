"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSessionCardRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const GameSessionCardRepositoryQueries_1 = require("./GameSessionCardRepositoryQueries");
class GameSessionCardRepository extends Table_1.default {
    async create(sessionId, cardSub, direction, tx) {
        return tx.query({
            name: 'createGameSessionCard',
            text: GameSessionCardRepositoryQueries_1.CREATE_GAME_SESSION_CARD,
            values: [sessionId, cardSub, direction],
        });
    }
    async createWithoutTx(sessionId, cardSub, direction) {
        const query = {
            name: 'createGameSessionCard',
            text: GameSessionCardRepositoryQueries_1.CREATE_GAME_SESSION_CARD,
            values: [sessionId, cardSub, direction],
        };
        await this.insertItem(query);
    }
    async getNextInSessionCard(sessionId) {
        const query = {
            name: 'getNextInSessionCard',
            text: GameSessionCardRepositoryQueries_1.GET_NEXT_IN_SESSION_CARD,
            values: [sessionId],
        };
        return this.getItem(query);
    }
    async createFeedAction(params) {
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
    async getLastAnsweredCard(sessionId) {
        const query = {
            name: 'getLastAnsweredCard',
            text: GameSessionCardRepositoryQueries_1.GET_LAST_ANSWERED_CARD,
            values: [sessionId],
        };
        return this.getItem(query);
    }
    async getCardInSessionBySub(sessionId, cardSub) {
        const query = {
            name: 'getCardInSessionBySub2',
            text: GameSessionCardRepositoryQueries_1.GET_CARD_IN_GAME_SESSION_BY_SUB2,
            values: [sessionId, cardSub],
        };
        return this.getItem(query);
    }
}
exports.GameSessionCardRepository = GameSessionCardRepository;
exports.default = new GameSessionCardRepository();
