"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCardPreferencesRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
class UserCardPreferencesRepository extends Table_1.default {
    async recordCardShown(userSub, cardSub) {
        const query = {
            name: 'recordCardShown',
            text: `
        INSERT INTO cards.user_card_preferences (user_sub, card_sub, action, shown_at)
        VALUES ($1, $2, 'shown', NOW())
        ON CONFLICT (user_sub, card_sub) 
        DO UPDATE SET 
          action = EXCLUDED.action,
          shown_at = EXCLUDED.shown_at
      `,
            values: [userSub, cardSub],
        };
        return this.updateItems(query);
    }
    async recordCardAction(userSub, cardSub, action) {
        const query = {
            name: 'recordCardAction',
            text: `
        INSERT INTO cards.user_card_preferences (user_sub, card_sub, action, shown_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_sub, card_sub) 
        DO UPDATE SET 
          action = EXCLUDED.action,
          shown_at = EXCLUDED.shown_at
      `,
            values: [userSub, cardSub, action],
        };
        return this.updateItems(query);
    }
    async getLikedCards(userSub, limit = 50) {
        const query = {
            name: 'getLikedCards',
            text: `
        SELECT card_sub 
        FROM cards.user_card_preferences 
        WHERE user_sub = $1 AND action = 'liked'
        ORDER BY shown_at DESC
        LIMIT $2
      `,
            values: [userSub, limit],
        };
        const result = await this.getItems(query);
        return result.map((row) => row.card_sub);
    }
    async getRecentShownCards(userSub, days = 7) {
        const query = {
            name: 'getRecentShownCards',
            text: `
        SELECT card_sub 
        FROM cards.user_card_preferences 
        WHERE user_sub = $1 
          AND shown_at > NOW() - INTERVAL '${days} days'
      `,
            values: [userSub],
        };
        const result = await this.getItems(query);
        return result.map((row) => row.card_sub);
    }
}
exports.UserCardPreferencesRepository = UserCardPreferencesRepository;
exports.default = new UserCardPreferencesRepository();
