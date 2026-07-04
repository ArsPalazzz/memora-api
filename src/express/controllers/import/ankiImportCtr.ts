import { NextFunction, Request, Response } from 'express';
import ankiImportService from '../../../services/import/AnkiImportService';
import { ajv } from '../../../utils';
import createError from 'http-errors';
import * as ankiImportPreviewDtoSchema from './schemas/ankiImportPreviewDto.json';
import * as ankiImportJobDtoSchema from './schemas/ankiImportJobDto.json';
import { ImportDeskRequest, ImportJobPayload } from '../../../services/import/ankiImport.types';

const validatePreviewDto = ajv.compile(ankiImportPreviewDtoSchema);
const validateJobDto = ajv.compile(ankiImportJobDtoSchema);

export async function ankiImportPreviewCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validatePreviewDto(req.body)) {
      return next(
        createError(422, 'Incorrect import preview body', {
          errors: validatePreviewDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;
    const desks = req.body.desks as ImportDeskRequest[];
    const preview = await ankiImportService.preview(creatorSub, desks);

    res.status(200).json(preview);
  } catch (e) {
    next(e);
  }
}

export async function ankiImportCreateJobCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateJobDto(req.body)) {
      return next(
        createError(422, 'Incorrect import job body', {
          errors: validateJobDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;
    const payload = req.body as unknown as ImportJobPayload;
    const job = await ankiImportService.createJob(creatorSub, payload);

    res.status(202).json(job);
  } catch (e) {
    next(e);
  }
}

export async function ankiImportGetJobCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorSub = res.locals.userSub as string;
    const jobSub = req.params.sub;
    const status = await ankiImportService.getJobStatus(creatorSub, jobSub);

    res.status(200).json(status);
  } catch (e) {
    next(e);
  }
}
