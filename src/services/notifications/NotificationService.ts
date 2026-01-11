import notificationRepository, {
  NotificationRepository,
} from '../../databases/postgre/entities/notification/NotificationRepository';

export class NotificationService {
  constructor(public notificationRepository: NotificationRepository) {}

  async saveToken(userSub: string, token: string, deviceInfo: object) {
    const exist = await this.notificationRepository.existToken(token);
    if (exist) {
      await this.notificationRepository.deactivateToken(token, 'replaced_by_new');
    }

    await this.notificationRepository.insertToken(userSub, token, deviceInfo);

    await this.notificationRepository.limitUserTokens(userSub, 5);
  }

  async deleteToken(userSub: string, token: string) {
    await this.notificationRepository.deactivateToken(token, 'user_logout');
  }

  async getActiveFcmTokens(userSub: string) {
    return this.notificationRepository.getActiveFcmTokens(userSub);
  }

  async deactivateInvalidToken(token: string, reason: string) {
    await this.notificationRepository.deactivateToken(token, reason);
  }
}

export default new NotificationService(notificationRepository);
