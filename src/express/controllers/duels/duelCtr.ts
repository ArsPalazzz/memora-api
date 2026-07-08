import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import duelService from '../../../services/games/duel/DuelService';
import duelRaceService from '../../../services/games/duel/DuelRaceService';
import duelNotificationService from '../../../services/games/duel/DuelNotificationService';
import gameService from '../../../services/games/GameService';
import duelLobbyCache from '../../../services/games/duel/DuelLobbyCache';
import { publishDuelRaceFinished } from '../../../services/games/duel/DuelEventBridge';
import { ajv } from '../../../utils';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../../exceptions';
import { DuelConfig } from '../../../services/games/duel/duel.types';

import * as createDuelBodyDtoSchema from './schemas/createDuelBodyDto.json';
import * as duelCodeParamsDtoSchema from './schemas/duelCodeParamsDto.json';
import * as duelFriendSubParamsDtoSchema from './schemas/duelFriendSubParamsDto.json';
import * as duelIdParamsDtoSchema from './schemas/duelIdParamsDto.json';
import * as duelHistoryQueryDtoSchema from './schemas/duelHistoryQueryDto.json';

const validateCreateDuelBodyDto = ajv.compile(createDuelBodyDtoSchema);
const validateDuelCodeParamsDto = ajv.compile(duelCodeParamsDtoSchema);
const validateDuelFriendSubParamsDto = ajv.compile(duelFriendSubParamsDtoSchema);
const validateDuelIdParamsDto = ajv.compile(duelIdParamsDtoSchema);
const validateDuelHistoryQueryDto = ajv.compile(duelHistoryQueryDtoSchema);

function handleDuelError(e: unknown, next: NextFunction) {
  if (e instanceof BadRequestError) {
    return next(createError(400, e.message));
  }
  if (e instanceof ForbiddenError) {
    return next(createError(403, e.message));
  }
  if (e instanceof NotFoundError) {
    return next(createError(404, e.message));
  }
  if (e instanceof ConflictError) {
    return next(createError(409, e.message));
  }
  next(e);
}

export async function createDuelCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateCreateDuelBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect duel body', {
          errors: validateCreateDuelBodyDto.errors,
        })
      );
    }

    const { deskSub, config, inviteFriendSub } = req.body as {
      deskSub: string;
      config?: Partial<DuelConfig>;
      inviteFriendSub?: string;
    };
    const userSub = res.locals.userSub as string;

    const duel = await duelService.createLobby(userSub, deskSub, config, inviteFriendSub);

    if (inviteFriendSub) {
      await duelNotificationService.sendDuelInvite({
        hostSub: userSub,
        inviteeSub: inviteFriendSub,
        duel,
      });
    }

    res.status(201).json({ duel });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function joinDuelCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { code: String(req.params.code ?? '').toUpperCase() };

    if (!validateDuelCodeParamsDto(params)) {
      return next(
        createError(422, 'Incorrect duel code', {
          errors: validateDuelCodeParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const duel = await duelService.joinLobby(userSub, params.code);
    res.json({ duel });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function getDuelCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { id: req.params.id };

    if (!validateDuelIdParamsDto(params)) {
      return next(
        createError(422, 'Incorrect duel id', {
          errors: validateDuelIdParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const duel = await duelService.getLobbyState(params.id, userSub);
    res.json({ duel });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function leaveDuelCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { id: req.params.id };

    if (!validateDuelIdParamsDto(params)) {
      return next(
        createError(422, 'Incorrect duel id', {
          errors: validateDuelIdParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const snapshot = await duelService.leaveLobby(userSub, params.id);
    await duelLobbyCache.set(params.id, snapshot);
    await duelLobbyCache.publishRemote(params.id, snapshot);
    res.json({ duel: snapshot });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function getDuelRacePayloadCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { id: req.params.id };

    if (!validateDuelIdParamsDto(params)) {
      return next(
        createError(422, 'Incorrect duel id', {
          errors: validateDuelIdParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const payload = await duelRaceService.getRacePayload(params.id, userSub);
    res.json({ payload });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function forfeitDuelRaceCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { id: req.params.id };

    if (!validateDuelIdParamsDto(params)) {
      return next(
        createError(422, 'Incorrect duel id', {
          errors: validateDuelIdParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const results = await duelRaceService.forfeit(params.id, userSub);
    publishDuelRaceFinished(params.id, results);
    res.json({ results });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function getDuelHeadToHeadStatsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { friendSub: req.params.friendSub };

    if (!validateDuelFriendSubParamsDto(params)) {
      return next(
        createError(422, 'Incorrect friend sub', {
          errors: validateDuelFriendSubParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const stats = await duelService.getHeadToHeadStats(userSub, params.friendSub);
    res.json({ stats });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function getDuelHistoryCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const query = { limit: req.query.limit ? Number(req.query.limit) : undefined };

    if (!validateDuelHistoryQueryDto(query)) {
      return next(
        createError(422, 'Incorrect duel history query', {
          errors: validateDuelHistoryQueryDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const history = await duelService.getHistory(userSub, query.limit ?? 20);
    res.json({ history });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function getDuelResultsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { id: req.params.id };

    if (!validateDuelIdParamsDto(params)) {
      return next(
        createError(422, 'Incorrect duel id', {
          errors: validateDuelIdParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const results = await duelRaceService.getFinishedResults(params.id, userSub);
    res.json({ results });
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}

export async function addDuelWrongCardsToInboxCtr(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const params = { id: req.params.id };

    if (!validateDuelIdParamsDto(params)) {
      return next(
        createError(422, 'Incorrect duel id', {
          errors: validateDuelIdParamsDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const cardSubs = await duelRaceService.getWrongCardSubs(params.id, userSub);
    const outcome = await gameService.addCardsToInbox(userSub, cardSubs);
    res.json(outcome);
  } catch (e: unknown) {
    handleDuelError(e, next);
  }
}
