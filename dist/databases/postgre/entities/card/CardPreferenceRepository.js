"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardPreferenceRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
class CardPreferenceRepository extends Table_1.default {
    async getShownCardsForSession(userSub, sessionId) {
        const query = {
            name: 'getShownCardsForSession',
            text: `
      SELECT DISTINCT sc.card_sub, sc.created_at
    FROM games.session_card sc
    JOIN games.session s ON s.id = sc.session_id
    WHERE s.user_sub = $1 AND s.id = $2
    ORDER BY sc.created_at DESC
    LIMIT 100;
    `,
            values: [userSub, sessionId],
        };
        return this.getItems(query);
    }
    async checkIfRecordExists(userSub, cardSub) {
        const query = {
            name: 'checkIfRecordExists',
            text: `SELECT 1 FROM cards.user_card_preferences WHERE user_sub = $1 AND card_sub = $2 LIMIT 1;`,
            values: [userSub, cardSub],
        };
        const result = await this.getItem(query);
        return !!result;
    }
    async insertAction({ userSub, cardSub, action, }) {
        const query = {
            name: 'insertAction',
            text: `INSERT INTO cards.user_card_preferences (user_sub, card_sub, action, shown_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP);`,
            values: [userSub, cardSub, action],
        };
        return this.insertItem(query);
    }
    async updateAction({ userSub, cardSub, action, }) {
        const query = {
            name: 'updateAction',
            text: `UPDATE cards.user_card_preferences SET action = $3, shown_at = CURRENT_TIMESTAMP WHERE user_sub = $1 AND card_sub = $2;`,
            values: [userSub, cardSub, action],
        };
        return this.updateItems(query);
    }
}
exports.CardPreferenceRepository = CardPreferenceRepository;
exports.default = new CardPreferenceRepository();
