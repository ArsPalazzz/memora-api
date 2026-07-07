import userRepository, { UserRepository } from '../../databases/postgre/entities/user/UserRepository';
import notificationService, { NotificationService } from '../notifications/NotificationService';
import fcmService, { FCMService } from '../notifications/FMCService';
import challengeService, { ChallengeService } from '../challenge/ChallengeService';

export class ChallengeNotificationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly challengeService: ChallengeService,
    private readonly notificationService: NotificationService,
    private readonly fcmService: FCMService
  ) {}

  async sendWeeklyChallengeAnnouncements(): Promise<void> {
    const deskTitle = await this.challengeService.getChallengeDeskTitle();
    if (!deskTitle) {
      return;
    }

    const users = await this.userRepository.getUsersForLeagueNotifications();
    for (const user of users) {
      try {
        await this.sendChallengeAnnouncement(user.sub, deskTitle);
      } catch (error) {
        console.error(`Failed to send challenge push to ${user.sub}:`, error);
      }
    }
  }

  async sendChallengeAnnouncement(userSub: string, deskTitle: string): Promise<boolean> {
    const state = await this.userRepository.getLeagueNotificationState(userSub);
    if (!state?.league_notifications) {
      return false;
    }

    const tokens = await this.notificationService.getActiveFcmTokens(userSub);
    if (tokens.length === 0) {
      return false;
    }

    const message = {
      title: 'Weekly challenge',
      body: `New weekly challenge: ${deskTitle}`,
      data: {
        type: 'challenge',
        action: 'open_home',
      },
    };

    let sentCount = 0;

    for (const { token } of tokens) {
      const result = await this.fcmService.sendPushNotification(
        token,
        message.title,
        message.body,
        message.data
      );

      if (result.success) {
        sentCount += 1;
      } else if (result.isInvalidToken) {
        await this.notificationService.deactivateInvalidToken(token, 'invalid_token_on_send');
      }
    }

    return sentCount > 0;
  }
}

export default new ChallengeNotificationService(
  userRepository,
  challengeService,
  notificationService,
  fcmService
);
