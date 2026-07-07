import { NextFunction, Request, Response } from 'express';
import userService from '../../../services/users/UserService';
import publicProfileService from '../../../services/users/PublicProfileService';
import cardService from '../../../services/cards/CardService';
import { BadRequestError, ConflictError, NotFoundError } from '../../../exceptions';
import { ajv } from '../../../utils';
import createError from 'http-errors';

import * as createUserDtoSchema from './schemas/createUserDto.json';
import * as updateMyProfileBodyDtoSchema from './schemas/updateMyProfileBodyDto.json';

const validateCreateUserDto = ajv.compile(createUserDtoSchema);
const validateUpdateMyProfileBodyDto = ajv.compile(updateMyProfileBodyDtoSchema);

export async function createUserCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateCreateUserDto(req.body)) {
      return next(
        createError(422, 'Incorrect user body', {
          errors: validateCreateUserDto.errors,
        })
      );
    }

    const { email, password, nickname } = req.body as {
      email: string;
      password: string;
      nickname: string;
    };

    const user = await userService.createUser({ email, pass: password, nickname });
    await cardService.createFeedSettings(user.sub);
    await cardService.createReviewSettings(user.sub);
    await cardService.createInboxDesk(user.sub);

    res.json(user);
  } catch (e: unknown) {
    if (e instanceof ConflictError) {
      return next(createError(409, e.message));
    }
    if (e instanceof BadRequestError) {
      return next(createError(400, e.message));
    }

    next(e);
  }
}

export async function getMyProfileCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    const profile = await userService.getProfile({ sub: userSub });
    const settings = await cardService.getFeedSettingsByUserSub(userSub);
    const reviewSettings = await cardService.getReviewSettingsByUserSub(userSub);

    res.json({ profile, settings: { ...settings, reviewSettings } });
  } catch (e: unknown) {
    next(e);
  }
}

export async function updateMyProfileCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateUpdateMyProfileBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect profile body', {
          errors: validateUpdateMyProfileBodyDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const body = req.body as { stats_public?: boolean; league_notifications?: boolean };

    await userService.updateMyProfile(userSub, body);

    const profile = await userService.getProfile({ sub: userSub });
    res.json({ profile });
  } catch (e: unknown) {
    next(e);
  }
}

export async function getDailyCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const daily = await userService.getDaily({ sub: res.locals.userSub as string });
    res.json(daily);
  } catch (e: unknown) {
    next(e);
  }
}

export async function getInboxSummaryCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const summary = await cardService.getInboxSummary(userSub);
    res.json(summary);
  } catch (e: unknown) {
    next(e);
  }
}

export async function searchUsersByNicknameCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';

    const userSub = res.locals.userSub as string;
    const users = await userService.searchUsersByNicknamePrefix(userSub, query);
    res.json(users);
  } catch (e: unknown) {
    if (e instanceof BadRequestError) {
      return next(createError(422, e.message));
    }
    next(e);
  }
}

export async function getPublicProfileCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const { nickname } = req.params;

    if (!nickname || typeof nickname !== 'string') {
      return next(createError(422, 'Invalid nickname'));
    }

    const viewerSub = res.locals.userSub as string | undefined;
    const profile = await publicProfileService.getPublicProfile(nickname, viewerSub);
    res.json(profile);
  } catch (e: unknown) {
    if (e instanceof BadRequestError) {
      return next(createError(422, e.message));
    }
    if (e instanceof NotFoundError) {
      return next(createError(404, e.message));
    }
    next(e);
  }
}
