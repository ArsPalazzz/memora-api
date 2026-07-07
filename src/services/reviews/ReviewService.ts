import reviewRepository, {
  ReviewRepository,
} from '../../databases/postgre/entities/review/ReviewRepository';
import notificationService, { NotificationService } from '../notifications/NotificationService';
import fcmService, { FCMService } from '../notifications/FMCService';
import cardService, { CardService } from '../cards/CardService';

export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly notificationService: NotificationService,
    private readonly cardService: CardService,
    private readonly fcmService: FCMService
  ) {}

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

      batchId = await this.reviewRepository.createBatch(userSub);
      if (!batchId) {
        throw new Error(`Cannot create batch`);
      }

      const reviewSettings = await this.cardService.getReviewSettingsByUserSub(userSub);

      await this.reviewRepository.addCardsToBatch(
        batchId,
        userSub,
        reviewSettings.cards_per_session
      );

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
}

export default new ReviewService(reviewRepository, notificationService, cardService, fcmService);
