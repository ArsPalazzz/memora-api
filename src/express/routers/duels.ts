import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  addDuelWrongCardsToInboxCtr,
  createDuelCtr,
  forfeitDuelRaceCtr,
  getDuelCtr,
  getDuelHeadToHeadStatsCtr,
  getDuelHistoryCtr,
  getDuelRacePayloadCtr,
  getDuelResultsCtr,
  joinDuelCtr,
  leaveDuelCtr,
} from '../controllers/duels/duelCtr';

const duels = Router();

duels.post('/duels', tokenValidator, createDuelCtr);
duels.post('/duels/:code/join', tokenValidator, joinDuelCtr);
duels.get('/duels/history', tokenValidator, getDuelHistoryCtr);
duels.get('/duels/stats/:friendSub', tokenValidator, getDuelHeadToHeadStatsCtr);
duels.get('/duels/:id/results', tokenValidator, getDuelResultsCtr);
duels.post('/duels/:id/wrong-cards/to-inbox', tokenValidator, addDuelWrongCardsToInboxCtr);
duels.get('/duels/:id/race-payload', tokenValidator, getDuelRacePayloadCtr);
duels.post('/duels/:id/race/forfeit', tokenValidator, forfeitDuelRaceCtr);
duels.get('/duels/:id', tokenValidator, getDuelCtr);
duels.delete('/duels/:id', tokenValidator, leaveDuelCtr);

export { duels };
