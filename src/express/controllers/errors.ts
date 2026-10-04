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
  error: HttpError & { statusCode?: number },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const status = error.status || error.statusCode || 500;

  console.log(error);
  if (status >= 500) {
    logger.error('Internal Server Error', error.message);
  } else {
    logger.info(`Handled error [${status}] :: ${error.message}`);
  }

  const userErrorResponse: UserErrorResponse = {
    status,
    message: error.message || 'Internal Server Error',
  };

  if (environment === 'development' && error.errors?.length) {
    userErrorResponse.errors = error.errors;
  }

  res.status(status);
  res.json(userErrorResponse);
}
