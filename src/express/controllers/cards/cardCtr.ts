import { NextFunction, Request, Response } from 'express';
import cardService from '../../../services/cards/CardService';
import userService from '../../../services/users/UserService';
import { ajv } from '../../../utils';
import createError from 'http-errors';

import * as createCardDtoSchema from './schemas/createCardDto.json';
import * as createDeskDtoSchema from './schemas/createDeskDto.json';
import * as createFolderDtoSchema from './schemas/createFolderDto.json';
import * as getDeskInfoDtoSchema from './schemas/getDeskInfoDto.json';
import * as updateDeskSettingsBodyDtoSchema from './schemas/updateDeskSettingsBodyDto.json';
import * as updateDeskSettingsParamsDtoSchema from './schemas/updateDeskSettingsParamsDto.json';
import * as updateDeskBodyDtoSchema from './schemas/updateDeskBodyDto.json';
import * as updateFeedSettingsBodyDtoSchema from './schemas/updateFeedSettingsBodyDto.json';
import * as updateCardBodyDtoSchema from './schemas/updateCardBodyDto.json';
import * as updateDeskParamsDtoSchema from './schemas/updateDeskParamsDto.json';
import { CARD_ORIENTATION } from '../../../services/cards/card.const';

const validateCreateCardDto = ajv.compile(createCardDtoSchema);
const validateCreateDeskDto = ajv.compile(createDeskDtoSchema);
const validateCreateFolderDto = ajv.compile(createFolderDtoSchema);
const validateGetDeskInfoDto = ajv.compile(getDeskInfoDtoSchema);
const validateUpdateDeskSettingsBodyDto = ajv.compile(updateDeskSettingsBodyDtoSchema);
const validateUpdateDeskSettingsParamsDto = ajv.compile(updateDeskSettingsParamsDtoSchema);
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

export async function getFoldersCtr(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorSub = res.locals.userSub as string;

    const folders = await cardService.getFolders(creatorSub);

    res.status(200).json(folders);
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

    const { sub, title, description, isPublic } = req.body as {
      sub: string;
      title: string;
      description: string;
      isPublic: boolean;
    };

    const creatorSub = res.locals.userSub as string;

    const deskInfo = await cardService.createDesk({
      sub,
      title,
      description,
      public: isPublic,
      creatorSub,
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
      cardOrientation: body.card_orientation as CARD_ORIENTATION,
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
