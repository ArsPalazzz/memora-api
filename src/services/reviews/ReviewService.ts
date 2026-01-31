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

      const reviewSettings = await this.cardService.getReviewSettingsByUserSub(userSub);

      await this.reviewRepository.addCardsToBatch(
        batchId,
        userSub,
        reviewSettings.cards_per_session
      );

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
        const result = await this.fcmService.sendPushNotification(
          token,
          message.title,
          message.body,
          message.data
        );

        if (result.success) {
          anySent = true;
        } else if (result.isInvalidToken) {
          await this.notificationService.deactivateInvalidToken(token, 'invalid_token_on_send');
        }
      }

      if (anySent) {
        await this.reviewRepository.markBatchAsNotified(batchId);
        console.log(`📨 Notified user ${userSub} about ${dueCount} cards`);
      } else {
        console.log(`⚠️ Failed to send notifications to ${userSub}`);
      }
    } catch (error) {
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
