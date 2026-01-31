import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  archivedDeskCtr,
  createCardCtr,
  createDeskCtr,
  createFolderCtr,
  deleteCardCtr,
  getArchivedDesksCtr,
  getCardCtr,
  getCardsCtr,
  getDeskCardsCtr,
  getDeskInfoCtr,
  getDesksCtr,
  getDeskSubsCtr,
  getFolderContentsCtr,
  getFolderInfoCtr,
  getFoldersCtr,
  restoreDeskCtr,
  updateCardCtr,
  updateDeskCtr,
  updateDeskSettingsCtr,
  updateFeedSettingsCtr,
  updateReviewSettingsCtr,
} from '../controllers/cards/cardCtr';

const cards = Router();

cards.get('/cards', tokenValidator, getCardsCtr);
cards.get('/desks', tokenValidator, getDesksCtr);
cards.get('/desks/archived', tokenValidator, getArchivedDesksCtr);
cards.get('/desks/short', tokenValidator, getDeskSubsCtr);
cards.post('/cards/create', tokenValidator, createCardCtr);
cards.get('/folders', tokenValidator, getFoldersCtr);
cards.get('/folders/:sub', tokenValidator, getFolderInfoCtr);
cards.get('/folders/:sub/contents', tokenValidator, getFolderContentsCtr);
cards.post('/folders', tokenValidator, createFolderCtr);
cards.post('/desks/create', tokenValidator, createDeskCtr);
cards.get('/desks/:sub', tokenValidator, getDeskInfoCtr);
cards.get('/desks/:sub/cards', tokenValidator, getDeskCardsCtr);
cards.put('/desks/:sub', tokenValidator, updateDeskCtr);
cards.put('/feed/settings', tokenValidator, updateFeedSettingsCtr);
cards.get('/cards/:sub', tokenValidator, getCardCtr);
cards.put('/cards/:sub', tokenValidator, updateCardCtr);
cards.delete('/cards/:sub', tokenValidator, deleteCardCtr);
cards.put('/desks/:sub/restore', tokenValidator, restoreDeskCtr);
cards.delete('/desks/:sub', tokenValidator, archivedDeskCtr);
cards.put('/desks/:sub/settings', tokenValidator, updateDeskSettingsCtr);
cards.put('/review/settings', tokenValidator, updateReviewSettingsCtr);

export { cards };
