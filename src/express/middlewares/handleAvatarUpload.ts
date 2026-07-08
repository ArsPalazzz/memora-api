import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import createError from 'http-errors';
import { avatarUploadMiddleware } from './avatarUpload';

export function handleAvatarUpload(req: Request, res: Response, next: NextFunction) {
  avatarUploadMiddleware(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(createError(400, 'Image is too large (max 10 MB)'));
        return;
      }

      next(createError(400, err.message));
      return;
    }

    if (err instanceof Error) {
      next(createError(400, err.message));
      return;
    }

    next(createError(400, 'Upload failed'));
  });
}
