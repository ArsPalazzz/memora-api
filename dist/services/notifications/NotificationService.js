"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const NotificationRepository_1 = __importDefault(require("../../databases/postgre/entities/notification/NotificationRepository"));
class NotificationService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async saveToken(userSub, token, deviceInfo) {
        const exist = await this.notificationRepository.existToken(token);
        if (exist) {
            await this.notificationRepository.deactivateToken(token, 'replaced_by_new');
        }
        await this.notificationRepository.insertToken(userSub, token, deviceInfo);
        await this.notificationRepository.limitUserTokens(userSub, 5);
    }
    async deleteToken(userSub, token) {
        await this.notificationRepository.deactivateToken(token, 'user_logout');
    }
    async getActiveFcmTokens(userSub) {
        return this.notificationRepository.getActiveFcmTokens(userSub);
    }
    async deactivateInvalidToken(token, reason) {
        await this.notificationRepository.deactivateToken(token, reason);
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService(NotificationRepository_1.default);
