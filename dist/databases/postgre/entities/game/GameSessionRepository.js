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
    async haveAccessToSession(sessionId, userSub) {
        const query = {
            name: 'haveAccessToSession',
            text: GameSessionRepositoryQueries_1.HAVE_ACCESS_TO_SESSION,
            values: [sessionId, userSub],
        };
        return this.exists(query);
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
