import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import { getCurrentChallengeCtr } from '../controllers/challenges/challengeCtr';

const challenges = Router();

challenges.get('/challenges/current', tokenValidator, getCurrentChallengeCtr);

export { challenges };
