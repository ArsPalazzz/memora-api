import { Request, Response, NextFunction } from 'express';
import authService from '../../../services/auth/AuthService';
import createError from 'http-errors';

import * as signInDtoSchema from './schemas/signInDto.json';
import { ajv } from '../../../utils';
import { Credentials } from '../../../services/auth/auth.types';

const validateSignInDto = ajv.compile(signInDtoSchema);

export async function authCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateSignInDto(req.body)) {
      return next(
        createError(422, 'Incorrect sign in params', {
          errors: validateSignInDto.errors,
        })
      );
    }

    const body = req.body as Credentials;

    const { accessToken, refreshToken } = await authService.login(body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      // TODO: Change before deployment
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('AuthService')) {
        return next(createError(401, e.message));
      }
    }
    next(e);
  }
}

export async function refreshCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const oldRefresh = req.cookies.refreshToken;
    if (!oldRefresh) return next(createError(401, 'No refresh token'));

    const { accessToken, refreshToken: newRefresh } = await authService.refreshSession(oldRefresh);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      // TODO: Change before deployment
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (e) {
    next(createError(401, `Refresh failed: ${e}`));
  }
}

export async function logoutCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        // TODO: Change before deployment
        secure: false,
        sameSite: 'lax',
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (e) {
    next(createError(500, 'Logout failed'));
  }
}
