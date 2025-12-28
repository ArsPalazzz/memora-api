import { Router } from 'express';
import { authCtr, authMeCtr, logoutCtr, refreshCtr } from '../controllers/auth/authCtr';
import { tokenValidator } from '../middlewares';

const auth = Router();

auth.post('/auth/sign-in', authCtr);
auth.get('/auth/me', authMeCtr);
auth.post('/auth/refresh', refreshCtr);
auth.post('/auth/logout', tokenValidator, logoutCtr);

export { auth };
