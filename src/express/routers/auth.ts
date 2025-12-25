import { Router } from 'express';
import { authCtr, logoutCtr, refreshCtr } from '../controllers/auth/authCtr';
import { tokenValidator } from '../middlewares';

const auth = Router();

auth.post('/auth/sign-in', authCtr);
auth.post('/auth/refresh', refreshCtr);
auth.post('/auth/logout', tokenValidator, logoutCtr);

export { auth };
