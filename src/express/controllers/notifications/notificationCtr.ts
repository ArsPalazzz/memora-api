import { NextFunction, Request, Response } from 'express';
import notificationService from '../../../services/notifications/NotificationService';

export async function saveTokenCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, deviceInfo = {} } = req.body as { token: string; deviceInfo: object };
    const userSub = res.locals.userSub as string;

    await notificationService.saveToken(userSub, token, deviceInfo);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export async function deleteTokenCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    const userSub = res.locals.userSub as string;

    await notificationService.deleteToken(userSub, token);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}
