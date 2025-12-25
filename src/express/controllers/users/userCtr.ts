import { NextFunction, Request, Response } from 'express';
import userService from '../../../services/users/UserService';
import { ajv } from '../../../utils';
import createError from 'http-errors';

import * as createUserDtoSchema from './schemas/createUserDto.json';

const validateCreateUserDto = ajv.compile(createUserDtoSchema);

export async function createUserCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateCreateUserDto(req.body)) {
      return next(
        createError(422, 'Incorrect user body', {
          errors: validateCreateUserDto.errors,
        })
      );
    }

    const { email, password } = req.body as { email: string; password: string };

    const user = await userService.createUser({ email, pass: password });
    res.json(user);
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message.includes('with this email')) {
        return next(createError(400, e.message));
      }
    }

    next(e);
  }
}

export async function getMyProfileCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getProfile({ sub: res.locals.userSub as string });
    res.json(profile);
  } catch (e: unknown) {
    next(e);
  }
}
