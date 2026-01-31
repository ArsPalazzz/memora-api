"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewSettingsRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const ReviewSettingsRepositoryQueries_1 = require("./ReviewSettingsRepositoryQueries");
class ReviewSettingsRepository extends Table_1.default {
    async create(userSub) {
        const query = {
            name: 'createReviewSettings',
            text: ReviewSettingsRepositoryQueries_1.CREATE_REVIEW_SETTINGS,
            values: [userSub],
        };
        return this.insertItem(query);
    }
    async existByUserSub(userSub) {
        const query = {
            name: 'existReviewSettingsByUserSub',
            text: ReviewSettingsRepositoryQueries_1.EXIST_REVIEW_SETTINGS_BY_USER_SUB,
            values: [userSub],
        };
        return this.exists(query);
    }
    async getByUserSub(userSub) {
        const query = {
            name: 'getReviewSettingsByUserSub',
            text: ReviewSettingsRepositoryQueries_1.GET_REVIEW_SETTINGS_BY_USER_SUB,
            values: [userSub],
        };
        return this.getItem(query);
    }
    async updateReviewSettings(params) {
        const query = {
            name: 'updateReviewSettings',
            text: ReviewSettingsRepositoryQueries_1.UPDATE_REVIEW_SETTINGS,
            values: [params.cards_per_session, params.userSub],
        };
        return this.updateItems(query);
    }
}
exports.ReviewSettingsRepository = ReviewSettingsRepository;
exports.default = new ReviewSettingsRepository();
