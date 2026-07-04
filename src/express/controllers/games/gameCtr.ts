import { NextFunction, Request, Response } from 'express';

import createError from 'http-errors';
import * as startDeskSessionBodyDtoSchema from './schemas/startDeskSessionBodyDto.json';
import * as startReviewSessionBodyDtoSchema from './schemas/startReviewSessionBodyDto.json';
import * as answerInGameSessionBodyDtoSchema from './schemas/answerInGameSessionBodyDto.json';
import * as answerFeedParamsDtoSchema from './schemas/answerFeedParamsDto.json';
import * as gradeCardInGameSessionBodyDtoSchema from './schemas/gradeCardInGameSessionBodyDto.json';
import * as getNextCardBodyDtoSchema from './schemas/getNextCardBodyDto.json';
import * as revealInGameSessionBodyDtoSchema from './schemas/revealInGameSessionBodyDto.json';
import * as matchSessionParamsDtoSchema from './schemas/matchSessionParamsDto.json';
import * as matchSubmitBodyDtoSchema from './schemas/matchSubmitBodyDto.json';
import { ajv } from '../../../utils';
import gameService from '../../../services/games/GameService';

const validateStartDeskSessionBodyDto = ajv.compile(startDeskSessionBodyDtoSchema);
const validateStartReviewSessionBodyDto = ajv.compile(startReviewSessionBodyDtoSchema);
const validateAnswerInGameSessionBodyDto = ajv.compile(answerInGameSessionBodyDtoSchema);
const validateAnswerFeedParamsDto = ajv.compile(answerFeedParamsDtoSchema);
const validateGradeCardInGameSessionBodyDto = ajv.compile(gradeCardInGameSessionBodyDtoSchema);
const validateGetNextCardBodyDto = ajv.compile(getNextCardBodyDtoSchema);
const validateRevealInGameSessionBodyDto = ajv.compile(revealInGameSessionBodyDtoSchema);
const validateMatchSessionParamsDto = ajv.compile(matchSessionParamsDtoSchema);
const validateMatchSubmitBodyDto = ajv.compile(matchSubmitBodyDtoSchema);

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

export async function startReviewSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateStartReviewSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect start review session body', {
          errors: validateStartReviewSessionBodyDto.errors,
        })
      );
    }

    const { batchId } = req.body as { batchId: string };

    const { sessionId } = await gameService.startReviewSession(userSub, batchId);

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

export async function answerInFeedSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    const userSub = res.locals.userSub as string;

    if (!validateAnswerFeedParamsDto(params)) {
      return next(
        createError(422, 'Incorrect answer in feed params', {
          errors: validateAnswerFeedParamsDto.errors,
        })
      );
    }

    if (!validateAnswerInGameSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect answer in feed body', {
          errors: validateAnswerInGameSessionBodyDto.errors,
        })
      );
    }

    const { sessionId, answer } = req.body as { sessionId: string; answer: string };

    const result = await gameService.answerFeedCard({
      sessionId,
      cardSub: params.sub,
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

    const { sessionId, quality, cardSub } = req.body as {
      sessionId: string;
      quality: number;
      cardSub?: string;
    };

    await gameService.gradeCard({ sessionId, userSub, quality, cardSub });

    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function gradeCardInFeedCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    const userSub = res.locals.userSub as string;

    if (!validateAnswerFeedParamsDto(params)) {
      return next(
        createError(422, 'Incorrect grade card in feed params', {
          errors: validateAnswerFeedParamsDto.errors,
        })
      );
    }

    if (!validateGradeCardInGameSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect grade card in feed body', {
          errors: validateGradeCardInGameSessionBodyDto.errors,
        })
      );
    }

    const { sessionId, quality } = req.body as { sessionId: string; quality: number };

    await gameService.gradeCardInFeed({ sessionId, userSub, quality, cardSub: params.sub });

    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function revealInGameSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateRevealInGameSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect reveal in game session body', {
          errors: validateRevealInGameSessionBodyDto.errors,
        })
      );
    }

    const { sessionId } = req.body as { sessionId: string };

    const result = await gameService.revealCard({ sessionId, userSub });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function revealInFeedSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    const userSub = res.locals.userSub as string;

    if (!validateAnswerFeedParamsDto(params)) {
      return next(
        createError(422, 'Incorrect reveal in feed params', {
          errors: validateAnswerFeedParamsDto.errors,
        })
      );
    }

    if (!validateAnswerInGameSessionBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect reveal in feed body', {
          errors: validateAnswerInGameSessionBodyDto.errors,
        })
      );
    }

    const { sessionId } = req.body as { sessionId: string };

    const result = await gameService.revealFeedCard({
      sessionId,
      cardSub: params.sub,
      userSub,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getMatchBoardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const params = { sessionId: req.params.sessionId };

    if (!validateMatchSessionParamsDto(params)) {
      return next(
        createError(422, 'Incorrect match board params', {
          errors: validateMatchSessionParamsDto.errors,
        })
      );
    }

    const board = await gameService.getMatchBoard({
      sessionId: params.sessionId,
      userSub,
    });

    res.json(board);
  } catch (e) {
    next(e);
  }
}

export async function submitMatchCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateMatchSubmitBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect match submit body', {
          errors: validateMatchSubmitBodyDto.errors,
        })
      );
    }

    const { sessionId, pairs } = req.body as {
      sessionId: string;
      pairs: { leftCardSub: string; rightSlotId: number }[];
    };

    const result = await gameService.submitMatch({ sessionId, userSub, pairs });

    res.json(result);
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

export async function startFeedSessionCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    const { sessionId, mode } = await gameService.startFeedSession(userSub);
    res.json({ sessionId, mode });
  } catch (e) {
    next(e);
  }
}

export async function swipeCardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    // if (!validateSwipeCardBodyDto(req.body)) {
    //   return next(
    //     createError(422, 'Incorrect swipe card body', {
    //       errors: validateSwipeCardBodyDto.errors,
    //     })
    //   );
    // }

    const { sessionId, cardSub, action, deskSub } = req.body as {
      sessionId: string;
      cardSub: string;
      action: 'like' | 'skip' | 'answer';
      deskSub?: string;
    };

    await gameService.swipeCard({ userSub, sessionId, cardSub, action, deskSub });
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function feedNextCardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    // if (!validateFeedNextCardBodyDto(req.query)) {
    //   return next(
    //     createError(422, 'Incorrect feed next card body', {
    //       errors: validateFeedNextCardBodyDto.errors,
    //     })
    //   );
    // }

    const { sessionId } = req.query as { sessionId: string };

    const card = await gameService.getFeedNextCard(userSub, sessionId);
    res.json(card);
  } catch (e) {
    next(e);
  }
}

export async function cardShownCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    // if (!validateFeedNextCardBodyDto(req.query)) {
    //   return next(
    //     createError(422, 'Incorrect feed next card body', {
    //       errors: validateFeedNextCardBodyDto.errors,
    //     })
    //   );
    // }

    const { cardSub, sessionId } = req.body as { cardSub: string; sessionId: string };

    const card = await gameService.cardShown(userSub, sessionId, cardSub);
    res.json(card);
  } catch (e) {
    next(e);
  }
}

export async function addCardToDeskCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    const { cardSub, deskSubs } = req.body as { cardSub: string; deskSubs: string[] };

    await gameService.addCardToDesk(userSub, cardSub, deskSubs);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}
