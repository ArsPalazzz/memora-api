"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCardSrsRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const UserCardSrsRepositoryQueries_1 = require("./UserCardSrsRepositoryQueries");
class UserCardSrsRepository extends Table_1.default {
    async get(userSub, cardSub) {
        const query = {
            name: 'getUserCardSrs',
            text: UserCardSrsRepositoryQueries_1.GET_USER_CARD_SRS,
            values: [userSub, cardSub],
        };
        return this.getItem(query);
    }
    async upsert(params) {
        const { userSub, cardSub, repetitions, intervalMinutes, easeFactor, nextReview } = params;
        const query = {
            name: 'upsertUserCardSrs',
            text: UserCardSrsRepositoryQueries_1.UPSERT_USER_CARDS_SRS,
            values: [userSub, cardSub, repetitions, intervalMinutes, easeFactor, nextReview],
        };
        return this.updateItems(query);
    }
    async createOrUpdate(params) {
        const { userSub, cardSub, repetitions = 0, intervalMinutes = 0, easeFactor = 2.5, nextReview = new Date(), } = params;
        const query = {
            name: 'createOrUpdateSrs',
            text: `
        INSERT INTO cards.user_card_srs 
          (user_sub, card_sub, repetitions, interval_minutes, ease_factor, next_review, last_review)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (user_sub, card_sub) 
        DO UPDATE SET
          repetitions = EXCLUDED.repetitions,
          interval_minutes = EXCLUDED.interval_minutes,
          ease_factor = EXCLUDED.ease_factor,
          next_review = EXCLUDED.next_review,
          last_review = NOW()
      `,
            values: [userSub, cardSub, repetitions, intervalMinutes, easeFactor, nextReview],
        };
        return this.updateItems(query);
    }
    async getUsersWithDueCards() {
        const query = {
            name: 'getUsersWithDueCards',
            text: UserCardSrsRepositoryQueries_1.GET_USERS_WITH_DUE_CARDS,
            values: [],
        };
        return this.getItems(query);
    }
}
exports.UserCardSrsRepository = UserCardSrsRepository;
exports.default = new UserCardSrsRepository();
