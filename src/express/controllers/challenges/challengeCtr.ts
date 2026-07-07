import { NextFunction, Request, Response } from 'express';
import challengeService from '../../../services/challenge/ChallengeService';
import { NotFoundError } from '../../../exceptions';
import createError from 'http-errors';

export async function getCurrentChallengeCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const challenge = await challengeService.getCurrentChallenge(userSub);
    res.json(challenge);
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      return next(createError(404, e.message));
    }
    next(e);
  }
}
