import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import authProvider from '../../providers/auth/AuthProvider';

export async function tokenValidator(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { authorization = 'Is empty' } = req.headers;
    const [, token] = authorization.split(' ');

    const tokenPayload = await authProvider.validateToken(token);

    res.locals.userSub = tokenPayload.sub;
    res.locals.userRole = tokenPayload.role;

    next();
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('cannot get')) {
      return next(createError(404, e.message));
    }

    res.set('WWW-Authenticate', 'Bearer');
    next(createError(401, 'Authentication required'));
  }
}
