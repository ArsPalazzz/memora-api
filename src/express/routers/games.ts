import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  addCardToDeskCtr,
  answerInGameSessionCtr,
  finishGameSessionCtr,
  getNextCardCtr,
  gradeCardInGameSessionCtr,
  startDeskSessionCtr,
  startReviewSessionCtr,
  startFeedSessionCtr,
  swipeCardCtr,
  feedNextCardCtr,
  cardShownCtr,
  answerInFeedSessionCtr,
  gradeCardInFeedCtr,
} from '../controllers/games/gameCtr';

const games = Router();

games.post('/games/start-desk-session', tokenValidator, startDeskSessionCtr);
games.post('/games/start-review-session', tokenValidator, startReviewSessionCtr);
games.post('/games/answer', tokenValidator, answerInGameSessionCtr);
games.post('/games/grade', tokenValidator, gradeCardInGameSessionCtr);
games.get('/games/next-card', tokenValidator, getNextCardCtr);
games.post('/games/finish', tokenValidator, finishGameSessionCtr);

games.post('/games/start-feed-session', tokenValidator, startFeedSessionCtr);
games.post('/games/swipe', tokenValidator, swipeCardCtr);
games.get('/games/feed-next', tokenValidator, feedNextCardCtr);
games.post('/games/answer-feed/:sub', tokenValidator, answerInFeedSessionCtr);
games.post('/games/grade-feed/:sub', tokenValidator, gradeCardInFeedCtr);
games.post('/games/card-shown', tokenValidator, cardShownCtr);
games.post('/games/add-to-desk', tokenValidator, addCardToDeskCtr);

export { games };
