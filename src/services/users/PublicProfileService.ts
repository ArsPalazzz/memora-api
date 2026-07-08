import userRepository, {
  UserRepository,
} from '../../databases/postgre/entities/user/UserRepository';
import cardRepository, {
  CardRepository,
} from '../../databases/postgre/entities/card/CardRepository';
import friendshipRepository, {
  FriendshipRepository,
} from '../../databases/postgre/entities/user/FriendshipRepository';
import userService, { UserService } from './UserService';
import { BadRequestError, NotFoundError } from '../../exceptions';
import { isValidPublicNickname } from './user.const';
import { getAvatarPublicUrl } from '../../utils/avatarUrl';

export class PublicProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cardRepository: CardRepository,
    private readonly userService: UserService,
    private readonly friendshipRepository: FriendshipRepository
  ) {}

  async getPublicProfile(nickname: string, viewerSub?: string) {
    if (!isValidPublicNickname(nickname)) {
      throw new BadRequestError('Invalid nickname');
    }

    const profile = await this.userRepository.getPublicProfileByNickname(nickname);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    const desks = await this.cardRepository.getProfileDesksByCreatorSub(
      profile.sub,
      viewerSub
        ? viewerSub !== profile.sub &&
            (await this.friendshipRepository.areAcceptedFriends(viewerSub, profile.sub))
        : false
    );

    const response: {
      nickname: string;
      memberSince: string;
      avatar_url: string | null;
      desks: {
        sub: string;
        title: string;
        cardCount: number;
        totalSaves: number;
      }[];
      stats?: {
        currentStreak: number;
        cardsReviewedThisWeek: number;
      };
    } = {
      nickname: profile.nickname,
      memberSince: profile.created_at,
      avatar_url: getAvatarPublicUrl(profile.avatar_key),
      desks: desks.map((desk) => ({
        sub: desk.sub,
        title: desk.title,
        cardCount: desk.card_count,
        totalSaves: desk.total_saves,
      })),
    };

    if (profile.stats_public) {
      response.stats = await this.userService.getPublicActivityStats(profile.sub);
    }

    return response;
  }
}

export default new PublicProfileService(
  userRepository,
  cardRepository,
  userService,
  friendshipRepository
);
