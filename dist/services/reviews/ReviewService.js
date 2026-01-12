"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const ReviewRepository_1 = __importDefault(require("../../databases/postgre/entities/review/ReviewRepository"));
const NotificationService_1 = __importDefault(require("../notifications/NotificationService"));
const FMCService_1 = __importDefault(require("../notifications/FMCService"));
class ReviewService {
    constructor(reviewRepository, notificationService, fcmService) {
        this.reviewRepository = reviewRepository;
        this.notificationService = notificationService;
        this.fcmService = fcmService;
    }
    async notifyUser(userSub, dueCount) {
        try {
            const alreadyNotified = await this.reviewRepository.existRecentBatch(userSub);
            if (alreadyNotified) {
                console.log(`⏸️ Already notified user ${userSub} recently`);
                return;
            }
            const batchId = await this.reviewRepository.createBatch(userSub);
            if (!batchId) {
                throw new Error(`Cannot create batch`);
            }
            await this.reviewRepository.addCardsToBatch(batchId, userSub);
            const tokens = await this.notificationService.getActiveFcmTokens(userSub);
            if (tokens.length === 0) {
                console.log(`📭 No active tokens for user ${userSub}`);
                return;
            }
            const message = {
                title: `${dueCount} words waiting to review`,
                body: 'Click to start session',
                data: {
                    type: 'review_batch',
                    batchId,
                    action: 'start_review',
                },
            };
            let anySent = false;
            for (const { token } of tokens) {
                const result = await this.fcmService.sendPushNotification(token, message.title, message.body, message.data);
                if (result.success) {
                    anySent = true;
                }
                else if (result.isInvalidToken) {
                    await this.notificationService.deactivateInvalidToken(token, 'invalid_token_on_send');
                }
            }
            if (anySent) {
                await this.reviewRepository.markBatchAsNotified(batchId);
                console.log(`📨 Notified user ${userSub} about ${dueCount} cards`);
            }
            else {
                console.log(`⚠️ Failed to send notifications to ${userSub}`);
            }
        }
        catch (error) {
            console.error(`❌ Error notifying user ${userSub}:`, error);
            throw error;
        }
    }
    async getCardSubsByBatchId(batchId) {
        const res = await this.reviewRepository.getBatchCards(batchId);
        return res.map((item) => item.card_sub);
    }
    async getBatchCardsForUser(batchId, userSub) {
        return await this.reviewRepository.getBatchCardsForUser(batchId, userSub);
    }
}
exports.ReviewService = ReviewService;
exports.default = new ReviewService(ReviewRepository_1.default, NotificationService_1.default, FMCService_1.default);
