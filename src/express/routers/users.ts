import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import { createUserCtr, getMyProfileCtr } from '../controllers/users/userCtr';

const users = Router();

users.post('/users/create', createUserCtr);
users.get('/users/my-profile', tokenValidator, getMyProfileCtr);

export { users };
