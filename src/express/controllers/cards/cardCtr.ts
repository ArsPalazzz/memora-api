import { NextFunction, Request, Response } from 'express';
import cardService from '../../../services/cards/CardService';
import cardImageService from '../../../services/cards/CardImageService';
import userService from '../../../services/users/UserService';
import { ajv } from '../../../utils';
import createError from 'http-errors';

import * as createCardDtoSchema from './schemas/createCardDto.json';
import * as createDeskDtoSchema from './schemas/createDeskDto.json';
import * as createFolderDtoSchema from './schemas/createFolderDto.json';
import * as getDeskInfoDtoSchema from './schemas/getDeskInfoDto.json';
import * as updateDeskSettingsBodyDtoSchema from './schemas/updateDeskSettingsBodyDto.json';
import * as updateReviewSettingsBodyDtoSchema from './schemas/updateReviewSettingsBodyDto.json';
import * as updateDeskSettingsParamsDtoSchema from './schemas/updateDeskSettingsParamsDto.json';
import * as moveDeskToFolderBodyDtoSchema from './schemas/moveDeskToFolderBodyDto.json';
import * as moveFolderParentBodyDtoSchema from './schemas/moveFolderParentBodyDto.json';
import * as updateDeskBodyDtoSchema from './schemas/updateDeskBodyDto.json';
import * as updateFeedSettingsBodyDtoSchema from './schemas/updateFeedSettingsBodyDto.json';
import * as updateCardBodyDtoSchema from './schemas/updateCardBodyDto.json';
import * as updateDeskParamsDtoSchema from './schemas/updateDeskParamsDto.json';
import { CARD_ORIENTATION, LanguageCode } from '../../../services/cards/card.const';
import { StudyMode } from '../../../services/games/studyMode.const';
import { ForbiddenError, NotFoundError, ConflictError, BadRequestError } from '../../../exceptions';

const validateCreateCardDto = ajv.compile(createCardDtoSchema);
const validateCreateDeskDto = ajv.compile(createDeskDtoSchema);
const validateCreateFolderDto = ajv.compile(createFolderDtoSchema);
const validateGetDeskInfoDto = ajv.compile(getDeskInfoDtoSchema);
const validateUpdateDeskSettingsBodyDto = ajv.compile(updateDeskSettingsBodyDtoSchema);
const validateUpdateReviewSettingsBodyDto = ajv.compile(updateReviewSettingsBodyDtoSchema);
const validateUpdateDeskSettingsParamsDto = ajv.compile(updateDeskSettingsParamsDtoSchema);
const validateMoveDeskToFolderBodyDto = ajv.compile(moveDeskToFolderBodyDtoSchema);
const validateMoveFolderParentBodyDto = ajv.compile(moveFolderParentBodyDtoSchema);
const validateUpdateDeskBodyDto = ajv.compile(updateDeskBodyDtoSchema);
const validateUpdateFeedSettingsBodyDto = ajv.compile(updateFeedSettingsBodyDtoSchema);
const validateUpdateCardBodyDto = ajv.compile(updateCardBodyDtoSchema);
const validateUpdateDeskParamsDto = ajv.compile(updateDeskParamsDtoSchema);

export async function getCardsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const cards = await cardService.getAllCards();
    res.json(cards);
  } catch (e) {
    next(e);
  }
}

export async function getDesksCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorSub = res.locals.userSub as string;

    const desks = await cardService.getUserDesksWithStats(creatorSub);
    res.json(desks);
  } catch (e) {
    next(e);
  }
}

export async function getArchivedDesksCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorSub = res.locals.userSub as string;

    const desks = await cardService.getArchivedDesksWithStats(creatorSub);
    res.json(desks);
  } catch (e) {
    next(e);
  }
}

export async function getDeskSubsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorSub = res.locals.userSub as string;

    const desks = await cardService.getUserDeskShort(creatorSub);
    res.json(desks);
  } catch (e) {
    next(e);
  }
}

export async function getDeskInfoCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateGetDeskInfoDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateGetDeskInfoDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    const desk = await cardService.getDesk({ sub: creatorSub, desk_sub: params.sub });
    res.json(desk);
  } catch (e) {
    next(e);
  }
}

export async function getDeskCardsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateGetDeskInfoDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateGetDeskInfoDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    const cards = await cardService.getCardsDesk({ sub: creatorSub, desk_sub: params.sub });
    res.json(cards);
  } catch (e) {
    next(e);
  }
}

export async function getPublicDeskCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateGetDeskInfoDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateGetDeskInfoDto.errors,
        })
      );
    }

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    if (
      (req.query.limit !== undefined && Number.isNaN(limit)) ||
      (req.query.offset !== undefined && Number.isNaN(offset))
    ) {
      return next(createError(422, 'Invalid pagination params'));
    }

    const desk = await cardService.getPublicDesk({
      deskSub: params.sub,
      viewerSub: res.locals.userSub as string | undefined,
      limit,
      offset,
    });
    res.json(desk);
  } catch (e: unknown) {
    if (e instanceof ForbiddenError) {
      return next(createError(403, e.message));
    }
    if (e instanceof NotFoundError) {
      return next(createError(404, e.message));
    }
    next(e);
  }
}

export async function addDeskToLibraryCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateGetDeskInfoDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateGetDeskInfoDto.errors,
        })
      );
    }

    const userSub = res.locals.userSub as string;
    const result = await cardService.addDeskToLibrary(userSub, params.sub);
    res.status(201).json(result);
  } catch (e: unknown) {
    if (e instanceof ConflictError) {
      return next(createError(409, e.message));
    }
    if (e instanceof ForbiddenError) {
      return next(createError(403, e.message));
    }
    if (e instanceof NotFoundError) {
      return next(createError(404, e.message));
    }
    next(e);
  }
}

export async function getLibrarySourcesCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const userSub = res.locals.userSub as string;
    const sources = await cardService.getLibrarySources(userSub);
    res.json(sources);
  } catch (e) {
    next(e);
  }
}

export async function createCardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateCreateCardDto(req.body)) {
      return next(
        createError(422, 'Incorrect card body', {
          errors: validateCreateCardDto.errors,
        })
      );
    }

    const payload = req.body as { front: string[]; back: string[]; desk_sub: string };
    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    const cardSub = await cardService.createCard(payload);
    res.json({ sub: cardSub });
  } catch (e) {
    next(e);
  }
}

export async function createFolderCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateCreateFolderDto(req.body)) {
      return next(
        createError(422, 'Incorrect folder body', {
          errors: validateCreateFolderDto.errors,
        })
      );
    }

    const { title, description, parent_folder_sub } = req.body as {
      title: string;
      description: string;
      parent_folder_sub: string | null;
    };

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.createFolder({
      title,
      description,
      parentFolderSub: parent_folder_sub,
      creatorSub,
    });

    res.sendStatus(201);
  } catch (e) {
    next(e);
  }
}

export const getFolderContentsCtr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sub } = req.params;

    const creatorSub = res.locals.userSub as string;

    const contents = await cardService.getFolderContents(sub, creatorSub);

    res.json(contents);
  } catch (e) {
    next(e);
  }
};

export const getFolderInfoCtr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sub } = req.params;
    const info = await cardService.getFolderInfo(sub);

    res.json(info);
  } catch (e) {
    next(e);
  }
};

export async function getFoldersCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorSub = res.locals.userSub as string;

    const folders = await cardService.getRootFolders(creatorSub);

    res.status(200).json(folders);
  } catch (e) {
    next(e);
  }
}

export async function getFoldersFlatCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorSub = res.locals.userSub as string;

    const folders = await cardService.getAllFoldersFlat(creatorSub);

    res.status(200).json(folders);
  } catch (e) {
    next(e);
  }
}

export async function moveDeskToFolderCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    if (!validateMoveDeskToFolderBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect move desk body', {
          errors: validateMoveDeskToFolderBodyDto.errors,
        })
      );
    }

    const { folder_sub } = req.body as { folder_sub: string | null };
    const creatorSub = res.locals.userSub as string;

    await cardService.moveDeskToFolder({
      deskSub: params.sub,
      folderSub: folder_sub,
      creatorSub,
    });

    res.json({ moved: true });
  } catch (e) {
    next(e);
  }
}

export async function moveFolderToParentCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect folder params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    if (!validateMoveFolderParentBodyDto(req.body)) {
      return next(
        createError(422, 'Incorrect move folder body', {
          errors: validateMoveFolderParentBodyDto.errors,
        })
      );
    }

    const { parent_folder_sub } = req.body as { parent_folder_sub: string | null };
    const creatorSub = res.locals.userSub as string;

    await cardService.moveFolderToParent({
      folderSub: params.sub,
      parentFolderSub: parent_folder_sub,
      creatorSub,
    });

    res.json({ moved: true });
  } catch (e) {
    next(e);
  }
}

export async function createDeskCtr(req: Request, res: Response, next: NextFunction) {
  try {
    if (!validateCreateDeskDto(req.body)) {
      return next(
        createError(422, 'Incorrect desk body', {
          errors: validateCreateDeskDto.errors,
        })
      );
    }

    const { sub, title, description, visibility, folder_sub, front_language, back_language, example_language } = req.body as {
      sub: string;
      title: string;
      description: string;
      visibility: 'private' | 'public' | 'friends' | 'unlisted';
      folder_sub: string | null;
      front_language?: LanguageCode;
      back_language?: LanguageCode;
      example_language?: LanguageCode;
    };

    const creatorSub = res.locals.userSub as string;

    const deskInfo = await cardService.createDesk({
      sub,
      title,
      description,
      visibility,
      creatorSub,
      folderSub: folder_sub,
      frontLanguage: front_language,
      backLanguage: back_language,
      exampleLanguage: example_language,
    });
    res.json(deskInfo);
  } catch (e) {
    next(e);
  }
}

export async function updateDeskCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };
    const body = {
      title: req.body.title as string,
      description: req.body.description as string,
      visibility: req.body.visibility as 'private' | 'public' | 'friends' | 'unlisted' | undefined,
    };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    if (!validateUpdateDeskBodyDto(body)) {
      return next(
        createError(422, 'Incorrect desk body', {
          errors: validateUpdateDeskBodyDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.updateDesk({
      deskSub: params.sub,
      body,
      creatorSub,
    });
    res.json({ updated: true });
  } catch (e) {
    next(e);
  }
}

export async function updateFeedSettingsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const body = {
      card_orientation: req.body.card_orientation as CARD_ORIENTATION,
      study_mode: req.body.study_mode as StudyMode,
    };

    if (!validateUpdateFeedSettingsBodyDto(body)) {
      return next(
        createError(422, 'Incorrect feed settings body', {
          errors: validateUpdateFeedSettingsBodyDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.updateFeedSettings({
      cardOrientation: body.card_orientation,
      studyMode: body.study_mode,
      creatorSub,
    });

    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function getCardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect card params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    const result = await cardService.getCard({
      cardSub: params.sub,
      creatorSub,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function updateCardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };
    const body = {
      front: req.body.front as string[],
      back: req.body.back as string[],
    };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect card params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    if (!validateUpdateCardBodyDto(body)) {
      return next(
        createError(422, 'Incorrect card body', {
          errors: validateUpdateCardBodyDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.updateCard({
      cardSub: params.sub,
      body,
      creatorSub,
    });
    res.json({ updated: true });
  } catch (e) {
    next(e);
  }
}

export async function regenerateCardExamplesCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect card params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    const result = await cardService.regenerateExamples({
      cardSub: params.sub,
      creatorSub,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function deleteCardCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect card params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.deleteCard({ cardSub: params.sub, creatorSub });
    res.json({ archived: true });
  } catch (e) {
    next(e);
  }
}

export async function archivedDeskCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.archiveDesk({ deskSub: params.sub, creatorSub });
    res.json({ archived: true });
  } catch (e) {
    next(e);
  }
}

export async function restoreDeskCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect desk params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.restoreDesk({ deskSub: params.sub, creatorSub });
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function updateDeskSettingsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };
    const body = {
      cards_per_session: req.body.cards_per_session as number,
      card_orientation: req.body.card_orientation as CARD_ORIENTATION,
      front_language: req.body.front_language as LanguageCode,
      back_language: req.body.back_language as LanguageCode,
      example_language: req.body.example_language as LanguageCode,
      study_mode: req.body.study_mode as StudyMode,
    };

    if (!validateUpdateDeskSettingsParamsDto(params)) {
      return next(
        createError(422, 'Incorrect desk settings params', {
          errors: validateUpdateDeskSettingsParamsDto.errors,
        })
      );
    }

    if (!validateUpdateDeskSettingsBodyDto(body)) {
      return next(
        createError(422, 'Incorrect desk settings body', {
          errors: validateUpdateDeskSettingsBodyDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.updateDeskSettings({
      deskSub: params.sub,
      body,
      creatorSub,
    });
    res.json({ updated: true });
  } catch (e) {
    next(e);
  }
}

export async function updateReviewSettingsCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const body = {
      cards_per_session: req.body.cards_per_session as number,
      study_mode: req.body.study_mode as StudyMode,
    };

    if (!validateUpdateReviewSettingsBodyDto(body)) {
      return next(
        createError(422, 'Incorrect review settings body', {
          errors: validateUpdateReviewSettingsBodyDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardService.updateReviewSettings({
      body,
      creatorSub,
    });

    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
}

export async function uploadCardImageCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect card params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;
    const file = req.file;

    if (!file) {
      return next(createError(400, 'Card image is required'));
    }

    await userService.existProfile({ sub: creatorSub });

    const imageUrl = await cardImageService.uploadCardImage({
      cardSub: params.sub,
      creatorSub,
      fileBuffer: file.buffer,
    });

    res.json({ image_url: imageUrl });
  } catch (e: unknown) {
    if (e instanceof BadRequestError) {
      return next(createError(400, e.message));
    }
    if (e instanceof ForbiddenError) {
      return next(createError(403, e.message));
    }
    if (e instanceof NotFoundError) {
      return next(createError(404, e.message));
    }
    next(e);
  }
}

export async function deleteCardImageCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const params = { sub: req.params.sub };

    if (!validateUpdateDeskParamsDto(params)) {
      return next(
        createError(422, 'Incorrect card params', {
          errors: validateUpdateDeskParamsDto.errors,
        })
      );
    }

    const creatorSub = res.locals.userSub as string;

    await userService.existProfile({ sub: creatorSub });

    await cardImageService.deleteCardImage({
      cardSub: params.sub,
      creatorSub,
    });

    res.json({ image_url: null });
  } catch (e: unknown) {
    if (e instanceof ForbiddenError) {
      return next(createError(403, e.message));
    }
    if (e instanceof NotFoundError) {
      return next(createError(404, e.message));
    }
    next(e);
  }
}
