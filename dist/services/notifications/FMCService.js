"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FCMService = void 0;
const firebase_admin_js_1 = require("../../lib/firebase-admin.js");
class FCMService {
    async sendPushNotification(token, title, body, data = {}) {
        try {
            const message = {
                token,
                notification: { title, body },
                data: {
                    ...data,
                    timestamp: Date.now().toString(),
                },
                android: { priority: 'high' },
                webpush: { headers: { Urgency: 'high' } },
            };
            const result = await firebase_admin_js_1.admin.messaging().send(message);
            console.log(`✅ Push sent: ${result}`);
            return { success: true };
        }
        catch (error) {
            console.error(`❌ Push error:`, error.message);
            const errorMsg = error.message || '';
            const isInvalidToken = errorMsg.includes('Requested entity was not found') ||
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
exports.FCMService = FCMService;
exports.default = new FCMService();
