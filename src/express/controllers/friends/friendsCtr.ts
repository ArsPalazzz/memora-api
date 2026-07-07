import { NextFunction, Request, Response } from 'express';
import friendshipService from '../../../services/users/FriendshipService';
import { BadRequestError, ConflictError, NotFoundError } from '../../../exceptions';
import { ajv } from '../../../utils';
import createError from 'http-errors';

import * as friendNicknameBodyDtoSchema from './schemas/friendNicknameBodyDto.json';
import * as friendRequesterBodyDtoSchema from './schemas/friendRequesterBodyDto.json';
import * as friendSubParamsDtoSchema from './schemas/friendSubParamsDto.json';
import * as friendNicknameParamsDtoSchema from './schemas/friendNicknameParamsDto.json';

const validateFriendNicknameBodyDto = ajv.compile(friendNicknameBodyDtoSchema);
const validateFriendRequesterBodyDto = ajv.compile(friendRequesterBodyDtoSchema);
const validateFriendSubParamsDto = ajv.compile(friendSubParamsDtoSchema);
const validateFriendNicknameParamsDto = ajv.compile(friendNicknameParamsDtoSchema);

function handleFriendshipError(e: unknown, next: NextFunction) {
  if (e instanceof BadRequestError) {
    return next(createError(400, e.message));
  }
  if (e instanceof ConflictError) {
    return next(createError(409, e.message));
  }
  if (e instanceof NotFoundError) {
    return next(createError(404, e.message));
  }
  next(e);
}

export async function sendFriendRequestCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateFriendNicknameBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect friend request body', {
          errors: validateFriendNicknameBodyDto.errors,
        })
      );
    }

    const { nickname } = req.body as { nickname: string };
    const userSub = res.locals.userSub as string;
    const result = await friendshipService.sendRequest(userSub, nickname);
    res.status(201).json(result);
  } catch (e: unknown) {
    handleFriendshipError(e, next);
  }
}

export async function acceptFriendRequestCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateFriendRequesterBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect accept body', {
          errors: validateFriendRequesterBodyDto.errors,
        })
      );
    }

    const { requesterSub } = req.body as { requesterSub: string };
    const userSub = res.locals.userSub as string;
    const result = await friendshipService.acceptRequest(userSub, requesterSub);
    res.json(result);
  } catch (e: unknown) {
    handleFriendshipError(e, next);
  }
}

export async function declineFriendRequestCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateFriendRequesterBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect decline body', {
          errors: validateFriendRequesterBodyDto.errors,
        })
      );
    }

    const { requesterSub } = req.body as { requesterSub: string };
    const userSub = res.locals.userSub as string;
    const result = await friendshipService.declineRequest(userSub, requesterSub);
    res.json(result);
  } catch (e: unknown) {
    handleFriendshipError(e, next);
  }
}

export async function listIncomingFriendRequestsCtr(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userSub = res.locals.userSub as string;
    const requests = await friendshipService.listIncomingRequests(userSub);
    res.json(requests);
  } catch (e: unknown) {
    next(e);
  }
}

export async function listFriendsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const friends = await friendshipService.listFriends(userSub);
    res.json(friends);
  } catch (e: unknown) {
    next(e);
  }
}

export async function getFriendsActivityCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const activity = await friendshipService.getFriendsActivity(userSub);
    res.json(activity);
  } catch (e: unknown) {
    next(e);
  }
}

export async function getWeeklyLeagueCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const league = await friendshipService.getWeeklyLeague(userSub);
    res.json(league);
  } catch (e: unknown) {
    next(e);
  }
}

export async function getFriendshipStatusCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { nickname: req.params.nickname };

    if (!validateFriendNicknameParamsDto(params)) {
      return next(
        createError(422, 'Invalid nickname', {
          errors: validateFriendNicknameParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const status = await friendshipService.getRelationshipStatus(userSub, params.nickname);
    res.json(status);
  } catch (e: unknown) {
    handleFriendshipError(e, next);
  }
}

export async function removeFriendCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { friendSub: req.params.friendSub };

    if (!validateFriendSubParamsDto(params)) {
      return next(
        createError(422, 'Invalid friend sub', {
          errors: validateFriendSubParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const result = await friendshipService.removeFriend(userSub, params.friendSub);
    res.json(result);
  } catch (e: unknown) {
    handleFriendshipError(e, next);
  }
}
