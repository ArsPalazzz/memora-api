import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  ankiImportCreateJobCtr,
  ankiImportGetJobCtr,
  ankiImportPreviewCtr,
} from '../controllers/import/ankiImportCtr';

const importRouter = Router();

importRouter.post('/anki/preview', tokenValidator, ankiImportPreviewCtr);
importRouter.post('/anki/jobs', tokenValidator, ankiImportCreateJobCtr);
importRouter.get('/anki/jobs/:sub', tokenValidator, ankiImportGetJobCtr);

export { importRouter };
