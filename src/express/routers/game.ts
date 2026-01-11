import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  answerInGameSessionCtr,
  finishGameSessionCtr,
  getNextCardCtr,
  gradeCardInGameSessionCtr,
  startDeskSessionCtr,
  startReviewSessionCtr,
} from '../controllers/games/gameCtr';

const games = Router();

games.post('/games/start-desk-session', tokenValidator, startDeskSessionCtr);
games.post('/games/start-review-session', tokenValidator, startReviewSessionCtr);
games.post('/games/answer', tokenValidator, answerInGameSessionCtr);
games.post('/games/grade', tokenValidator, gradeCardInGameSessionCtr);
games.get('/games/next-card', tokenValidator, getNextCardCtr);
games.post('/games/finish', tokenValidator, finishGameSessionCtr);

export { games };
