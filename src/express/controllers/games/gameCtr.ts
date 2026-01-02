import { NextFunction, Request, Response } from 'express';

import createError from 'http-errors';
import * as startDeskSessionBodyDtoSchema from './schemas/startDeskSessionBodyDto.json';
import * as answerInGameSessionBodyDtoSchema from './schemas/answerInGameSessionBodyDto.json';
import * as gradeCardInGameSessionBodyDtoSchema from './schemas/gradeCardInGameSessionBodyDto.json';
import * as getNextCardBodyDtoSchema from './schemas/getNextCardBodyDto.json';
import { ajv } from '../../../utils';
import gameService from '../../../services/games/GameService';

const validateStartDeskSessionBodyDto = ajv.compile(startDeskSessionBodyDtoSchema);
const validateAnswerInGameSessionBodyDto = ajv.compile(answerInGameSessionBodyDtoSchema);
const validateGradeCardInGameSessionBodyDto = ajv.compile(gradeCardInGameSessionBodyDtoSchema);
const validateGetNextCardBodyDto = ajv.compile(getNextCardBodyDtoSchema);

export async function startDeskSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateStartDeskSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect start desk session body', {
          errors: validateStartDeskSessionBodyDto.errors,
        })
      );
    }

    const { deskSub } = req.body as { deskSub: string };

    const { sessionId } = await gameService.startGameSession(userSub, deskSub);

    res.json({ sessionId });
  } catch (e) {
    next(e);
  }
}

export async function answerInGameSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateAnswerInGameSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect answer in game session body', {
          errors: validateAnswerInGameSessionBodyDto.errors,
        })
      );
    }

    const { sessionId, answer } = req.body as { sessionId: string; answer: string };

    const result = await gameService.answerCard({
      sessionId,
      userSub,
      answer,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function gradeCardInGameSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateGradeCardInGameSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect grade card in game session body', {
          errors: validateGradeCardInGameSessionBodyDto.errors,
        })
      );
    }

    const { sessionId, quality } = req.body as { sessionId: string; quality: number };

    await gameService.gradeCard({ sessionId, userSub, quality });

    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function getNextCardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateGetNextCardBodyDto(req.query)) {
      return next(
        createError(422, 'Incorrect get next card body', {
          errors: validateGetNextCardBodyDto.errors,
        })
      );
    }

    const { sessionId } = req.query as { sessionId: string };

    const card = await gameService.getNextCard(userSub, sessionId);

    res.json(card);
  } catch (e) {
    next(e);
  }
}

export async function finishGameSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateGetNextCardBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect answer in game session body', {
          errors: validateGetNextCardBodyDto.errors,
        })
      );
    }

    const { sessionId } = req.body as { sessionId: string };

    await gameService.finishGameSession({ sessionId, userSub });

    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}
