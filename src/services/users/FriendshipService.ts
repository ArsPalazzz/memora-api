import friendshipRepository, {
  FriendshipRepository,
} from '../../databases/postgre/entities/user/FriendshipRepository';
import userRepository, {
  UserRepository,
} from '../../databases/postgre/entities/user/UserRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../../exceptions';
import { isValidPublicNickname } from './user.const';
import { getUtcWeekBounds, rankLeagueParticipants } from './leagueScore';

export type FriendshipStatus = 'none' | 'pending' | 'accepted';
export type FriendshipDirection = 'outgoing' | 'incoming' | null;

export class FriendshipService {
  constructor(
    private readonly friendshipRepository: FriendshipRepository,
    private readonly userRepository: UserRepository
  ) {}

  async sendRequest(requesterSub: string, nickname: string) {
    if (!isValidPublicNickname(nickname)) {
      throw new BadRequestError('Invalid nickname');
    }

    const addressee = await this.userRepository.getPublicProfileByNickname(nickname);
    if (!addressee) {
      throw new NotFoundError('User not found');
    }

    if (addressee.sub === requesterSub) {
      throw new BadRequestError('Cannot send a friend request to yourself');
    }

    const existing = await this.friendshipRepository.getBetween(requesterSub, addressee.sub);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new ConflictError('Already friends');
      }

      if (existing.requester_sub === requesterSub) {
        throw new ConflictError('Friend request already sent');
      }

      throw new ConflictError('This user already sent you a friend request');
    }

    await this.friendshipRepository.createRequest(requesterSub, addressee.sub);

    return {
      nickname: addressee.nickname,
      sub: addressee.sub,
      status: 'pending' as const,
    };
  }

  async acceptRequest(addresseeSub: string, requesterSub: string) {
    if (requesterSub === addresseeSub) {
      throw new BadRequestError('Invalid friend request');
    }

    const accepted = await this.friendshipRepository.accept(requesterSub, addresseeSub);
    if (!accepted) {
      throw new NotFoundError('Friend request not found');
    }

    return { requesterSub, status: 'accepted' as const };
  }

  async declineRequest(addresseeSub: string, requesterSub: string) {
    if (requesterSub === addresseeSub) {
      throw new BadRequestError('Invalid friend request');
    }

    const declined = await this.friendshipRepository.deletePending(requesterSub, addresseeSub);
    if (!declined) {
      throw new NotFoundError('Friend request not found');
    }

    return { declined: true };
  }

  async removeFriend(userSub: string, friendSub: string) {
    if (userSub === friendSub) {
      throw new BadRequestError('Invalid friend');
    }

    const removed = await this.friendshipRepository.deleteBetween(userSub, friendSub);
    if (!removed) {
      throw new NotFoundError('Friendship not found');
    }

    return { removed: true };
  }

  async listIncomingRequests(userSub: string) {
    const requests = await this.friendshipRepository.getIncomingRequests(userSub);
    return requests.map((request) => ({
      sub: request.sub,
      nickname: request.nickname,
    }));
  }

  async listFriends(userSub: string) {
    const friends = await this.friendshipRepository.getAcceptedFriends(userSub);
    return friends.map((friend) => ({
      sub: friend.sub,
      nickname: friend.nickname,
    }));
  }

  async getFriendsActivity(userSub: string) {
    const rows = await this.friendshipRepository.getFriendsActivity(userSub);
    return rows.map((row) => ({
      nickname: row.nickname,
      cardsReviewedToday: row.cards_reviewed,
      dailyGoal: row.daily_goal,
      goalAchieved: row.goal_achieved,
      currentStreak: row.current_streak,
    }));
  }

  async getWeeklyLeague(userSub: string) {
    const rows = await this.friendshipRepository.getWeeklyLeague(userSub);
    const weekBounds = rows[0]
      ? { weekStart: rows[0].week_start.slice(0, 10), weekEnd: rows[0].week_end.slice(0, 10) }
      : getUtcWeekBounds();

    const participants = rankLeagueParticipants(
      rows.map((row) => ({
        nickname: row.nickname,
        isMe: row.is_me,
        cardsReviewed: row.cards_reviewed,
        goalsHit: row.goals_hit,
        currentStreak: row.current_streak,
      }))
    );

    const me = participants.find((participant) => participant.isMe);

    return {
      weekStart: weekBounds.weekStart,
      weekEnd: weekBounds.weekEnd,
      participants,
      myRank: me?.rank ?? null,
      totalParticipants: participants.length,
    };
  }

  async getRelationshipStatus(userSub: string, nickname: string) {
    if (!isValidPublicNickname(nickname)) {
      throw new BadRequestError('Invalid nickname');
    }

    const target = await this.userRepository.getPublicProfileByNickname(nickname);
    if (!target) {
      throw new NotFoundError('User not found');
    }

    if (target.sub === userSub) {
      return {
        sub: target.sub,
        nickname: target.nickname,
        status: 'none' as FriendshipStatus,
        direction: null as FriendshipDirection,
      };
    }

    const relationship = await this.friendshipRepository.getBetween(userSub, target.sub);
    if (!relationship) {
      return {
        sub: target.sub,
        nickname: target.nickname,
        status: 'none' as FriendshipStatus,
        direction: null as FriendshipDirection,
      };
    }

    const direction: FriendshipDirection =
      relationship.status === 'pending'
        ? relationship.requester_sub === userSub
          ? 'outgoing'
          : 'incoming'
        : null;

    return {
      sub: target.sub,
      nickname: target.nickname,
      status: relationship.status as FriendshipStatus,
      direction,
    };
  }
}

export default new FriendshipService(friendshipRepository, userRepository);
