import { Router } from 'express';
import { tokenValidator } from '../middlewares';
import {
  acceptFriendRequestCtr,
  declineFriendRequestCtr,
  getFriendshipStatusCtr,
  getFriendsActivityCtr,
  getWeeklyLeagueCtr,
  listIncomingFriendRequestsCtr,
  listFriendsCtr,
  removeFriendCtr,
  sendFriendRequestCtr,
} from '../controllers/friends/friendsCtr';

const friends = Router();

friends.post('/friends/request', tokenValidator, sendFriendRequestCtr);
friends.post('/friends/accept', tokenValidator, acceptFriendRequestCtr);
friends.post('/friends/decline', tokenValidator, declineFriendRequestCtr);
friends.get('/friends', tokenValidator, listFriendsCtr);
friends.get('/friends/requests', tokenValidator, listIncomingFriendRequestsCtr);
friends.get('/friends/activity', tokenValidator, getFriendsActivityCtr);
friends.get('/friends/league', tokenValidator, getWeeklyLeagueCtr);
friends.get('/friends/status/:nickname', tokenValidator, getFriendshipStatusCtr);
friends.delete('/friends/:friendSub', tokenValidator, removeFriendCtr);

export { friends };
