import { Request, Response, NextFunction } from 'express';
import createError, { HttpError } from 'http-errors';

import logger from '../../logger';
import { environment } from '../../config';

type UserErrorResponse = {
  status: number;
  message: string;
  errors?: string[];
};

export function unhandled(req: Request, res: Response, next: NextFunction) {
  return next(createError.NotFound);
}

export function errors(
  error: HttpError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.log(error);
  if (!error.status) {
    logger.error('Internal Server Error', error.message);
  } else {
    logger.info(`Handled error [${error.status}] :: ${error.message}`);
  }

  const userErrorResponse: UserErrorResponse = {
    status: error.status || 500,
    message: error.message || 'Internal Server Error',
  };

  if (environment === 'development' && error.errors?.length) {
    userErrorResponse.errors = error.errors;
  }

  res.status(error.status || 500);
  res.json(userErrorResponse);
}
