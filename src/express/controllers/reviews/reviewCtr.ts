import { NextFunction, Request, Response } from 'express';
import reviewService from '../../../services/reviews/ReviewService';

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
    const result = await reviewService.startReview(userSub);

    res.json(result);
  } catch (e) {
    next(e);
  }
}
