import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import { createUserCtr, getDailyCtr, getMyProfileCtr } from '../controllers/users/userCtr';

const users = Router();

users.post('/users/create', createUserCtr);
users.get('/users/my-profile', tokenValidator, getMyProfileCtr);
users.get('/users/daily', tokenValidator, getDailyCtr);

export { users };
