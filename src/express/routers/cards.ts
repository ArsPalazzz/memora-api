import { Router } from 'express';
import { tokenValidator, optionalTokenValidator } from '../middlewares';
import { handleCardImageUpload } from '../middlewares/handleCardImageUpload';
import {
  archivedDeskCtr,
  createCardCtr,
  createDeskCtr,
  createFolderCtr,
  deleteCardCtr,
  getArchivedDesksCtr,
  getCardCtr,
  getCardsCtr,
  addDeskToLibraryCtr,
  getDeskCardsCtr,
  getDeskInfoCtr,
  getDesksCtr,
  getDeskSubsCtr,
  getLibrarySourcesCtr,
  getPublicDeskCtr,
  getFolderContentsCtr,
  getFolderInfoCtr,
  getFoldersCtr,
  getFoldersFlatCtr,
  moveDeskToFolderCtr,
  moveFolderToParentCtr,
  regenerateCardExamplesCtr,
  restoreDeskCtr,
  updateCardCtr,
  updateDeskCtr,
  updateDeskSettingsCtr,
  updateFeedSettingsCtr,
  updateReviewSettingsCtr,
  uploadCardImageCtr,
  deleteCardImageCtr,
} from '../controllers/cards/cardCtr';

const cards = Router();

cards.get('/cards', tokenValidator, getCardsCtr);
cards.get('/desks', tokenValidator, getDesksCtr);
cards.get('/desks/archived', tokenValidator, getArchivedDesksCtr);
cards.get('/desks/short', tokenValidator, getDeskSubsCtr);
cards.get('/me/library/sources', tokenValidator, getLibrarySourcesCtr);
cards.post('/cards/create', tokenValidator, createCardCtr);
cards.get('/folders', tokenValidator, getFoldersCtr);
cards.get('/folders/flat', tokenValidator, getFoldersFlatCtr);
cards.get('/folders/:sub', tokenValidator, getFolderInfoCtr);
cards.get('/folders/:sub/contents', tokenValidator, getFolderContentsCtr);
cards.post('/folders', tokenValidator, createFolderCtr);
cards.put('/folders/:sub/parent', tokenValidator, moveFolderToParentCtr);
cards.post('/desks/create', tokenValidator, createDeskCtr);
cards.get('/desks/:sub/public', optionalTokenValidator, getPublicDeskCtr);
cards.post('/desks/:sub/add-to-library', tokenValidator, addDeskToLibraryCtr);
cards.get('/desks/:sub', tokenValidator, getDeskInfoCtr);
cards.get('/desks/:sub/cards', tokenValidator, getDeskCardsCtr);
cards.put('/desks/:sub', tokenValidator, updateDeskCtr);
cards.put('/desks/:sub/folder', tokenValidator, moveDeskToFolderCtr);
cards.put('/feed/settings', tokenValidator, updateFeedSettingsCtr);
cards.get('/cards/:sub', tokenValidator, getCardCtr);
cards.post('/cards/:sub/regenerate-examples', tokenValidator, regenerateCardExamplesCtr);
cards.put('/cards/:sub', tokenValidator, updateCardCtr);
cards.post('/cards/:sub/image', tokenValidator, handleCardImageUpload, uploadCardImageCtr);
cards.delete('/cards/:sub/image', tokenValidator, deleteCardImageCtr);
cards.delete('/cards/:sub', tokenValidator, deleteCardCtr);
cards.put('/desks/:sub/restore', tokenValidator, restoreDeskCtr);
cards.delete('/desks/:sub', tokenValidator, archivedDeskCtr);
cards.put('/desks/:sub/settings', tokenValidator, updateDeskSettingsCtr);
cards.put('/review/settings', tokenValidator, updateReviewSettingsCtr);

export { cards };
