import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import { startReviewCtr } from '../controllers/reviews/reviewCtr';

const reviews = Router();

reviews.post('/reviews/start', tokenValidator, startReviewCtr);

export { reviews };
