import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  archivedDeskCtr,
  createCardCtr,
  createDeskCtr,
  getCardsCtr,
  getDeskInfoCtr,
  getDesksCtr,
  updateCardCtr,
  updateDeskCtr,
  updateDeskSettingsCtr,
} from '../controllers/cards/cardCtr';

const cards = Router();

cards.get('/cards', tokenValidator, getCardsCtr);
cards.get('/desks', tokenValidator, getDesksCtr);
cards.post('/cards/create', tokenValidator, createCardCtr);
cards.post('/desks/create', tokenValidator, createDeskCtr);
cards.get('/desks/:sub', tokenValidator, getDeskInfoCtr);
cards.put('/desks/:sub', tokenValidator, updateDeskCtr);
cards.put('/cards/:sub', tokenValidator, updateCardCtr);
cards.delete('/desks/:sub', tokenValidator, archivedDeskCtr);
cards.put('/desks/:sub/settings', tokenValidator, updateDeskSettingsCtr);

export { cards };
