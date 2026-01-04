"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCardSrsRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
class UserCardSrsRepository extends Table_1.default {
    async get(userSub, cardSub) {
        const query = {
            name: 'getUserCardSrs',
            text: `
      SELECT *
      FROM cards.user_card_srs
      WHERE user_sub = $1 AND card_sub = $2
    `,
            values: [userSub, cardSub],
        };
        return this.getItem(query);
    }
    async upsert(params) {
        const { userSub, cardSub, repetitions, intervalDays, easeFactor, nextReview } = params;
        const query = {
            name: 'upsertUserCardSrs',
            text: `
      INSERT INTO cards.user_card_srs (
        user_sub,
        card_sub,
        repetitions,
        interval_days,
        ease_factor,
        last_review,
        next_review
      )
      VALUES ($1,$2,$3,$4,$5,NOW(),$6)
      ON CONFLICT (user_sub, card_sub)
      DO UPDATE SET
        repetitions = $3,
        interval_days = $4,
        ease_factor = $5,
        last_review = NOW(),
        next_review = $6
    `,
            values: [userSub, cardSub, repetitions, intervalDays, easeFactor, nextReview],
        };
        return this.updateItems(query);
    }
}
exports.UserCardSrsRepository = UserCardSrsRepository;
exports.default = new UserCardSrsRepository();
