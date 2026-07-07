import reviewRepository, {
  ReviewRepository,
} from '../../databases/postgre/entities/review/ReviewRepository';
import notificationService, { NotificationService } from '../notifications/NotificationService';
import fcmService, { FCMService } from '../notifications/FMCService';
import cardService, { CardService } from '../cards/CardService';
import { BadRequestError } from '../../exceptions';

type ReviewBatchResult = {
  batchId: string;
  cardCount: number;
  dueCount: number;
  inboxCount: number;
};

export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly notificationService: NotificationService,
    private readonly cardService: CardService,
    private readonly fcmService: FCMService
  ) {}

  async getReviewSummary(userSub: string) {
    return this.cardService.getReviewDueSummary(userSub);
  }

  async startReview(userSub: string): Promise<ReviewBatchResult> {
    const batch = await this.createReviewBatch(userSub, { includeInbox: true });
    if (!batch) {
      throw new BadRequestError('No cards to study');
    }

    await this.reviewRepository.markBatchAsNotified(batch.batchId);

    return batch;
  }

  async notifyUser(userSub: string, dueCount: number): Promise<void> {
    let batchId: string | null = null;

    try {
      const recentlyNotified = await this.reviewRepository.existRecentNotification(userSub);
      if (recentlyNotified) {
        console.log(`⏸️ Push cooldown active for user ${userSub}`);
        return;
      }

      const tokens = await this.notificationService.getActiveFcmTokens(userSub);
      if (tokens.length === 0) {
        console.log(`📭 No active FCM tokens for user ${userSub}, skipping push`);
        return;
      }

      const batch = await this.createReviewBatch(userSub, { includeInbox: false });
      if (!batch) {
        console.log(`📭 No due cards in batch for user ${userSub}, skipping push`);
        return;
      }

      batchId = batch.batchId;

      const message = {
        title: `${dueCount} words waiting to review`,
        body: 'Click to start session',
        data: {
          type: 'review_batch',
          batchId,
          action: 'start_review',
        },
      };

      let sentCount = 0;
      let failedCount = 0;

      for (const { token } of tokens) {
        const result = await this.fcmService.sendPushNotification(
          token,
          message.title,
          message.body,
          message.data
        );

        if (result.success) {
          sentCount += 1;
        } else {
          failedCount += 1;
          if (result.isInvalidToken) {
            await this.notificationService.deactivateInvalidToken(token, 'invalid_token_on_send');
            console.log(`🗑️ Deactivated invalid FCM token for user ${userSub}`);
          } else {
            console.log(`❌ FCM send failed for user ${userSub}: ${result.error}`);
          }
        }
      }

      if (sentCount > 0) {
        await this.reviewRepository.markBatchAsNotified(batchId);
        console.log(
          `📨 Notified user ${userSub} about ${dueCount} cards (${sentCount}/${tokens.length} tokens)`
        );
        return;
      }

      await this.reviewRepository.deleteUnnotifiedBatch(batchId);
      batchId = null;
      console.log(
        `⚠️ Failed to send review push to user ${userSub} (${failedCount}/${tokens.length} tokens failed)`
      );
    } catch (error) {
      if (batchId) {
        await this.reviewRepository.deleteUnnotifiedBatch(batchId);
      }
      console.error(`❌ Error notifying user ${userSub}:`, error);
      throw error;
    }
  }

  async getCardSubsByBatchId(batchId: string) {
    const res = await this.reviewRepository.getBatchCards(batchId);

    return res.map((item) => item.card_sub);
  }

  async getBatchCardsForUser(batchId: string, userSub: string) {
    return await this.reviewRepository.getBatchCardsForUser(batchId, userSub);
  }

  private async createReviewBatch(
    userSub: string,
    options: { includeInbox: boolean }
  ): Promise<ReviewBatchResult | null> {
    const reviewSettings = await this.cardService.getReviewSettingsByUserSub(userSub);
    const sessionLimit = reviewSettings.cards_per_session;

    const batchId = await this.reviewRepository.createBatch(userSub);
    if (!batchId) {
      throw new Error('Cannot create batch');
    }

    await this.reviewRepository.addDueCardsToBatch(batchId, userSub, sessionLimit);
    const dueCount = await this.reviewRepository.getBatchCardCount(batchId);

    let inboxCount = 0;
    if (options.includeInbox) {
      const remainingLimit = sessionLimit - dueCount;
      if (remainingLimit > 0) {
        await this.reviewRepository.addInboxCardsToBatch(batchId, userSub, remainingLimit);
      }
      inboxCount = (await this.reviewRepository.getBatchCardCount(batchId)) - dueCount;
    }

    const cardCount = dueCount + inboxCount;
    if (cardCount === 0) {
      await this.reviewRepository.deleteUnnotifiedBatch(batchId);
      return null;
    }

    return { batchId, cardCount, dueCount, inboxCount };
  }
}

export default new ReviewService(reviewRepository, notificationService, cardService, fcmService);
