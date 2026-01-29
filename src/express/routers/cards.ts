import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  archivedDeskCtr,
  createCardCtr,
  createDeskCtr,
  deleteCardCtr,
  getCardsCtr,
  getDeskInfoCtr,
  getDesksCtr,
  getDeskSubsCtr,
  updateCardCtr,
  updateDeskCtr,
  updateDeskSettingsCtr,
  updateFeedSettingsCtr,
} from '../controllers/cards/cardCtr';

const cards = Router();

cards.get('/cards', tokenValidator, getCardsCtr);
cards.get('/desks', tokenValidator, getDesksCtr);
cards.get('/desks/short', tokenValidator, getDeskSubsCtr);
cards.post('/cards/create', tokenValidator, createCardCtr);
cards.post('/desks/create', tokenValidator, createDeskCtr);
cards.get('/desks/:sub', tokenValidator, getDeskInfoCtr);
cards.put('/desks/:sub', tokenValidator, updateDeskCtr);
cards.put('/feed/settings', tokenValidator, updateFeedSettingsCtr);
cards.put('/cards/:sub', tokenValidator, updateCardCtr);
cards.delete('/cards/:sub', tokenValidator, deleteCardCtr);
cards.delete('/desks/:sub', tokenValidator, archivedDeskCtr);
cards.put('/desks/:sub/settings', tokenValidator, updateDeskSettingsCtr);

export { cards };
