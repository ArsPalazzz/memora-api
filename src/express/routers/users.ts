import { Router } from 'express';
import { tokenValidator, optionalTokenValidator } from '../middlewares';
import { createUserCtr, getDailyCtr, getInboxSummaryCtr, getMyProfileCtr, getPublicProfileCtr, searchUsersByNicknameCtr, updateMyProfileCtr, uploadAvatarCtr, deleteAvatarCtr } from '../controllers/users/userCtr';
import { getReviewSummaryCtr } from '../controllers/reviews/reviewCtr';
import { handleAvatarUpload } from '../middlewares/handleAvatarUpload';

const users = Router();

users.post('/users/create', createUserCtr);
users.get('/users/my-profile', tokenValidator, getMyProfileCtr);
users.patch('/users/my-profile', tokenValidator, updateMyProfileCtr);
users.post('/users/me/avatar', tokenValidator, handleAvatarUpload, uploadAvatarCtr);
users.delete('/users/me/avatar', tokenValidator, deleteAvatarCtr);
users.get('/users/search', tokenValidator, searchUsersByNicknameCtr);
users.get('/users/:nickname/public', optionalTokenValidator, getPublicProfileCtr);
users.get('/users/review-summary', tokenValidator, getReviewSummaryCtr);
users.get('/users/inbox-summary', tokenValidator, getInboxSummaryCtr);
users.get('/users/daily', tokenValidator, getDailyCtr);

export { users };
