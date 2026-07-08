import userRepository, { UserRepository } from '../../../databases/postgre/entities/user/UserRepository';
import notificationService, { NotificationService } from '../../notifications/NotificationService';
import fcmService, { FCMService } from '../../notifications/FMCService';
import { DuelResponse } from './duel.types';

export class DuelNotificationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
    private readonly fcmService: FCMService
  ) {}

  async sendDuelInvite(params: {
    hostSub: string;
    inviteeSub: string;
    duel: DuelResponse;
  }): Promise<boolean> {
    const host = await this.userRepository.getProfileBySub(params.hostSub);
    if (!host) {
      return false;
    }

    const tokens = await this.notificationService.getActiveFcmTokens(params.inviteeSub);
    if (tokens.length === 0) {
      return false;
    }

    const cardCount = params.duel.config.cardCount;
    const title = 'Duel challenge';
    const body = `@${host.nickname} challenged you on ${params.duel.deskTitle}, ${cardCount} cards`;

    const data = {
      type: 'duel_invite',
      code: params.duel.code,
      duelId: params.duel.id,
      action: 'open_duel_invite',
    };

    let sentCount = 0;

    for (const { token } of tokens) {
      const result = await this.fcmService.sendPushNotification(token, title, body, data);

      if (result.success) {
        sentCount += 1;
      } else if (result.isInvalidToken) {
        await this.notificationService.deactivateInvalidToken(token, 'invalid_token_on_send');
      }
    }

    return sentCount > 0;
  }
}

export default new DuelNotificationService(userRepository, notificationService, fcmService);
