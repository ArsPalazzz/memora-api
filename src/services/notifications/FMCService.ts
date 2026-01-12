import { admin } from '../../lib/firebase-admin.js';

export class FCMService {
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: object = {}
  ): Promise<{ success: boolean; error?: string; isInvalidToken?: boolean }> {
    try {
      const message = {
        token,
        title,
        body,
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        android: { priority: 'high' as const },
        webpush: { headers: { Urgency: 'high' } },
      };

      const result = await admin.messaging().send(message);
      console.log(`✅ Push sent: ${result}`);

      return { success: true };
    } catch (error: any) {
      console.error(`❌ Push error:`, error.message);

      const errorMsg: string = error.message || '';
      const isInvalidToken =
        errorMsg.includes('Requested entity was not found') ||
        errorMsg.includes('registration-token-not-registered') ||
        errorMsg.includes('invalid-registration-token');

      return {
        success: false,
        error: error.message,
        isInvalidToken,
      };
    }
  }
}

export default new FCMService();
