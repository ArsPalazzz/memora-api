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
    async getNextInSessionCard(sessionId) {
        const query = {
            name: 'getNextInSessionCard',
            text: GameSessionCardRepositoryQueries_1.GET_NEXT_IN_SESSION_CARD,
            values: [sessionId],
        };
        return this.getItem(query);
    }
}
exports.GameSessionCardRepository = GameSessionCardRepository;
exports.default = new GameSessionCardRepository();
