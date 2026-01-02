import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  answerInGameSessionCtr,
  finishGameSessionCtr,
  getNextCardCtr,
  startDeskSessionCtr,
} from '../controllers/games/gameCtr';

const games = Router();

games.post('/games/start-desk-session', tokenValidator, startDeskSessionCtr);
games.post('/games/answer', tokenValidator, answerInGameSessionCtr);
games.get('/games/next-card', tokenValidator, getNextCardCtr);
games.post('/games/finish', tokenValidator, finishGameSessionCtr);

export { games };
