import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import { deleteTokenCtr, saveTokenCtr } from '../controllers/notifications/notificationCtr';

const notifications = Router();

notifications.post('/notifications/subscribe', tokenValidator, saveTokenCtr);
notifications.post('/notifications/unsubscribe', tokenValidator, deleteTokenCtr);

export { notifications };
