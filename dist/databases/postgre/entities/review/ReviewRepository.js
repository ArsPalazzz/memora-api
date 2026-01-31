"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const ReviewRepositoryQueries_1 = require("./ReviewRepositoryQueries");
class ReviewRepository extends Table_1.default {
    async existRecentBatch(userSub) {
        const query = {
            name: 'getRecentBatches',
            text: ReviewRepositoryQueries_1.EXIST_RECENT_BATCH,
            values: [userSub],
        };
        return this.exists(query);
    }
    async createBatch(userSub) {
        const query = {
            name: 'createBatch',
            text: ReviewRepositoryQueries_1.CREATE_BATCH,
            values: [userSub],
        };
        return this.insertItem(query, 'id');
    }
    async addCardsToBatch(batchId, userSub, limit) {
        const query = {
            name: 'addCardsToBatch',
            text: ReviewRepositoryQueries_1.ADD_CARDS_TO_BATCH,
            values: [batchId, userSub, limit],
        };
        await this.insertItem(query);
    }
    async markBatchAsNotified(batchId) {
        const query = {
            name: 'markBatchAsNotified',
            text: ReviewRepositoryQueries_1.MARK_BATCH_AS_NOTIFIED,
            values: [batchId],
        };
        await this.updateItems(query);
    }
    async getBatchCards(batchId) {
        const query = {
            name: 'getBatchCards',
            text: ReviewRepositoryQueries_1.GET_BATCH_CARDS,
            values: [batchId],
        };
        return this.getItems(query);
    }
    async getBatchCardsForUser(batchId, userSub) {
        const query = {
            name: 'getBatchCardsForUser',
            text: ReviewRepositoryQueries_1.GET_BATCH_CARDS_FOR_USER,
            values: [batchId, userSub],
        };
        return this.getItems(query);
    }
}
exports.ReviewRepository = ReviewRepository;
exports.default = new ReviewRepository();
