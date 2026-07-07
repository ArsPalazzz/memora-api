import userRepository, { UserRepository } from '../../databases/postgre/entities/user/UserRepository';
import friendshipService, { FriendshipService } from './FriendshipService';
import notificationService, { NotificationService } from '../notifications/NotificationService';
import fcmService, { FCMService } from '../notifications/FMCService';
import {
  didLeagueRankWorsen,
  findLeagueOvertaker,
  getUtcDateString,
} from './leagueScore';

export class LeagueNotificationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly friendshipService: FriendshipService,
    private readonly notificationService: NotificationService,
    private readonly fcmService: FCMService
  ) {}

  async checkLeagueOvertakeForUser(userSub: string): Promise<void> {
    const state = await this.userRepository.getLeagueNotificationState(userSub);
    if (!state?.league_notifications) {
      return;
    }

    const todayUtc = getUtcDateString();
    if (state.league_last_notified_date?.slice(0, 10) === todayUtc) {
      return;
    }

    const league = await this.friendshipService.getWeeklyLeague(userSub);
    if (league.totalParticipants < 2 || league.myRank == null) {
      await this.userRepository.updateLeagueNotificationState(userSub, {
        lastRank: league.myRank,
        weekStart: league.weekStart,
      });
      return;
    }

    const previousWeekStart = state.league_last_week_start?.slice(0, 10) ?? null;
    const previousRank = state.league_last_rank;

    if (previousWeekStart !== league.weekStart) {
      await this.userRepository.updateLeagueNotificationState(userSub, {
        lastRank: league.myRank,
        weekStart: league.weekStart,
      });
      return;
    }

    if (didLeagueRankWorsen(previousRank, league.myRank)) {
      const overtaker = findLeagueOvertaker(league.participants, league.myRank);
      if (overtaker) {
        const sent = await this.sendOvertakeNotification(userSub, overtaker.nickname);
        if (sent) {
          await this.userRepository.markLeagueNotifiedToday(userSub, todayUtc);
        }
      }
    }

    await this.userRepository.updateLeagueNotificationState(userSub, {
      lastRank: league.myRank,
      weekStart: league.weekStart,
    });
  }

  async sendOvertakeNotification(userSub: string, overtakerNickname: string): Promise<boolean> {
    const tokens = await this.notificationService.getActiveFcmTokens(userSub);
    if (tokens.length === 0) {
      return false;
    }

    const message = {
      title: 'Weekly league',
      body: `@${overtakerNickname} обогнал тебя в weekly league`,
      data: {
        type: 'league',
        action: 'open_league',
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

export default new LeagueNotificationService(
  userRepository,
  friendshipService,
  notificationService,
  fcmService
);
