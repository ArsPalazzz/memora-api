"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const NotificationRepositoryQueries_1 = require("./NotificationRepositoryQueries");
class NotificationRepository extends Table_1.default {
    async insertToken(userSub, token, deviceInfo) {
        const query = {
            name: 'insertToken',
            text: NotificationRepositoryQueries_1.INSERT_TOKEN,
            values: [userSub, token, deviceInfo],
        };
        return this.insertItem(query);
    }
    async existToken(token) {
        const query = {
            name: 'existToken',
            text: NotificationRepositoryQueries_1.EXIST_TOKEN,
            values: [token],
        };
        return this.exists(query);
    }
    async deactivateToken(token, reason) {
        const query = {
            name: 'deactivateToken',
            text: NotificationRepositoryQueries_1.DEACTIVATE_TOKEN,
            values: [token, reason],
        };
        await this.updateItems(query);
    }
    async getActiveFcmTokens(userSub) {
        const query = {
            name: 'getActiveFcmTokens',
            text: NotificationRepositoryQueries_1.GET_ACTIVE_FCM_TOKENS,
            values: [userSub],
        };
        return this.getItems(query);
    }
    async limitUserTokens(userSub, maxTokens) {
        const query = {
            name: 'limitUserTokens',
            text: NotificationRepositoryQueries_1.LIMIT_USER_TOKENS,
            values: [userSub, maxTokens],
        };
        await this.updateItems(query);
    }
}
exports.NotificationRepository = NotificationRepository;
exports.default = new NotificationRepository();
