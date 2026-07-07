import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  addCardToDeskCtr,
  addCardToInboxCtr,
  answerInGameSessionCtr,
  revealInGameSessionCtr,
  revealInFeedSessionCtr,
  getMatchBoardCtr,
  submitMatchCtr,
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
games.post('/games/reveal', tokenValidator, revealInGameSessionCtr);
games.post('/games/reveal-feed/:sub', tokenValidator, revealInFeedSessionCtr);
games.get('/games/match-board/:sessionId', tokenValidator, getMatchBoardCtr);
games.post('/games/match-submit', tokenValidator, submitMatchCtr);
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
games.post('/games/add-to-inbox', tokenValidator, addCardToInboxCtr);

export { games };
