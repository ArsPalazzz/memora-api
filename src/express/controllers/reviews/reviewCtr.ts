import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import { ajv } from '../../../utils';
import reviewService from '../../../services/reviews/ReviewService';
import * as startReviewBodyDtoSchema from './schemas/startReviewBodyDto.json';

const validateStartReviewBodyDto = ajv.compile(startReviewBodyDtoSchema);

export async function getReviewSummaryCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const summary = await reviewService.getReviewSummary(userSub);

    res.json(summary);
  } catch (e) {
    next(e);
  }
}

export async function startReviewCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;

    if (!validateStartReviewBodyDto(req.body ?? {})) {
      return next(
        createError(422, 'Incorrect start review body', {
          errors: validateStartReviewBodyDto.errors,
        })
      );
    }

    const { deskSubs, includeInbox } = req.body as {
      deskSubs?: string[];
      includeInbox?: boolean;
    };

    const result = await reviewService.startReview(userSub, {
      deskSubs,
      includeInbox,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}
