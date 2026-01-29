"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedSettingsRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const FeedSettingsRepositoryQueries_1 = require("./FeedSettingsRepositoryQueries");
class FeedSettingsRepository extends Table_1.default {
    async create(userSub) {
        const query = {
            name: 'createFeedSettings',
            text: FeedSettingsRepositoryQueries_1.CREATE_FEED_SETTINGS,
            values: [userSub],
        };
        return this.insertItem(query);
    }
    async existByUserSub(userSub) {
        const query = {
            name: 'existFeedSettingsByUserSub',
            text: FeedSettingsRepositoryQueries_1.EXIST_FEED_SETTINGS_BY_USER_SUB,
            values: [userSub],
        };
        return this.exists(query);
    }
    async getByUserSub(userSub) {
        const query = {
            name: 'getFeedSettingsByUserSub',
            text: FeedSettingsRepositoryQueries_1.GET_FEED_SETTINGS_BY_USER_SUB,
            values: [userSub],
        };
        return this.getItem(query);
    }
}
exports.FeedSettingsRepository = FeedSettingsRepository;
exports.default = new FeedSettingsRepository();
