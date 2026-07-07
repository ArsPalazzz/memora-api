import userRepository, {
  UserRepository,
} from '../../databases/postgre/entities/user/UserRepository';
import {
  CreateUserPayload,
  ExistUserPayload,
  GetDailyPayload,
  GetProfilePayload,
} from './user.interfaces';
import { v4 as uuidv4 } from 'uuid';
import authProvider, { AuthProvider } from '../../providers/auth/AuthProvider';
import {
  GET_CARD_NUMBER_BY_DAY,
  GOAL_ADJUSTMENT_STEP,
  MAX_CARDS_DAILY,
  MIN_CARDS_DAILY,
  UserRole,
  isValidPublicNickname,
  isValidNicknameSearchPrefix,
} from './user.const';
import streakStatsRepository, {
  StreakStatsRepository,
} from '../../databases/postgre/entities/user/StreakStatsRepository';
import dailyStatsRepository, {
  DailyStatsRepository,
} from '../../databases/postgre/entities/user/DailyStatsRepository';
import { BadRequestError, ConflictError } from '../../exceptions';

export class UserService {
  constructor(
    public userRepository: UserRepository,
    public streakStatsRepository: StreakStatsRepository,
    public dailyStatsRepository: DailyStatsRepository,
    public authProvider: AuthProvider
  ) {}

  async createUser(params: CreateUserPayload) {
    const nickname = params.nickname.trim().toLowerCase();

    if (!isValidPublicNickname(nickname)) {
      throw new BadRequestError('Invalid nickname');
    }

    const exists = await this.userRepository.existByEmail(params.email);
    if (exists) {
      throw new ConflictError('User with this email is already exist');
    }

    const nicknameTaken = await this.userRepository.existsByNickname(nickname);
    if (nicknameTaken) {
      throw new ConflictError('Nickname is already taken');
    }

    const userInfo = this.generateUserInfo();
    const passwordHash = await this.authProvider.createPasswordHash(params.pass);

    const userData = {
      ...userInfo,
      nickname,
      email: params.email,
      role: UserRole.REGISTERED,
    };

    const userId = await this.userRepository.createUser({
      ...userData,
      passwordHash,
    });
    if (!userId) {
      throw new Error('Cannot create user');
    }

    await this.streakStatsRepository.insert({ userId });

    return { ...userData, password: params.pass };
  }

  async searchUsersByNicknamePrefix(viewerSub: string, query: string) {
    const prefix = query.trim().toLowerCase();

    if (!isValidNicknameSearchPrefix(prefix)) {
      throw new BadRequestError('Invalid search query');
    }

    return this.userRepository.searchByNicknamePrefix(prefix, viewerSub);
  }

  async getProfile(params: GetProfilePayload) {
    const exists = await this.userRepository.existBySub(params.sub);
    if (!exists) {
      throw new Error("User with this sub doesn't exist");
    }

    return await this.userRepository.getProfileBySub(params.sub);
  }

  async getProfileId(sub: string) {
    const exists = await this.userRepository.existBySub(sub);
    if (!exists) {
      throw new Error("User with this sub doesn't exist");
    }

    const res = await this.userRepository.getProfileIdBySub(sub);
    if (!res) {
      throw new Error('Cannot get profile id by sub');
    }

    return res.id;
  }

  async addCardInDaily(userId: number) {
    const today = new Date().toISOString().split('T')[0];

    const dailyStat = await this.dailyStatsRepository.getByUserIdAndDate(userId, today);
    if (!dailyStat) {
      const streakStats = await this.streakStatsRepository.getByUserId(userId);
      if (!streakStats) {
        throw new Error(`Cannot get streak stats by user id`);
      }

      await this.dailyStatsRepository.create({
        userId,
        date: today,
        cardsReviewed: 1,
        dailyGoal: GET_CARD_NUMBER_BY_DAY(streakStats.current_streak),
        goalAchieved: false,
      });
    } else {
      dailyStat.cards_reviewed += 1;
      dailyStat.goal_achieved = dailyStat.cards_reviewed >= dailyStat.daily_goal;
      await this.dailyStatsRepository.incrementCardsReviewed(dailyStat.id);
    }
  }

  async getDaily(params: GetDailyPayload) {
    const profile = await this.userRepository.getProfileIdBySub(params.sub);
    if (!profile) {
      throw new Error(`Profile not found`);
    }

    const exists = await this.dailyStatsRepository.existByUserId({ userId: profile.id });
    if (!exists) {
      return {
        currentStreak: 1,
        dailyGoal: MIN_CARDS_DAILY,
        cardsReviewed: 0,
      };
    }

    const streak = await this.streakStatsRepository.getByUserId(profile.id);
    if (!streak) {
      throw new Error(`Cannot get streak stats by user id`);
    }

    const lastDaily = await this.dailyStatsRepository.getLastByUserId(profile.id);
    if (!lastDaily) {
      throw new Error(`Cannot get last daily stats by user id`);
    }

    const today = new Date();
    const lastDate = new Date(lastDaily.date);

    let newGoal = lastDaily.daily_goal;

    if (lastDate.toDateString() !== today.toDateString()) {
      if (lastDaily.goal_achieved) {
        newGoal = Math.min(lastDaily.daily_goal + GOAL_ADJUSTMENT_STEP, MAX_CARDS_DAILY);
      } else {
        newGoal = MIN_CARDS_DAILY;
      }
    }

    return {
      currentStreak: streak.current_streak,
      dailyGoal: newGoal,
      cardsReviewed:
        lastDate.toDateString() === today.toDateString() ? lastDaily.cards_reviewed : 0,
    };
  }

  async existProfile(params: ExistUserPayload) {
    const exists = await this.userRepository.existBySub(params.sub);
    if (!exists) {
      throw new Error("User with this sub doesn't exist");
    }

    return true;
  }

  async updateStatsPublic(sub: string, statsPublic: boolean) {
    await this.getProfile({ sub });
    await this.userRepository.updateStatsPublic(sub, statsPublic);
  }

  async updateMyProfile(
    sub: string,
    updates: { stats_public?: boolean; league_notifications?: boolean }
  ) {
    await this.getProfile({ sub });

    if (updates.stats_public !== undefined) {
      await this.userRepository.updateStatsPublic(sub, updates.stats_public);
    }

    if (updates.league_notifications !== undefined) {
      await this.userRepository.updateLeagueNotifications(sub, updates.league_notifications);
    }
  }

  async getPublicActivityStats(userSub: string) {
    const profileId = await this.getProfileId(userSub);
    const streak = await this.streakStatsRepository.getByUserId(profileId);

    return {
      currentStreak: streak?.current_streak ?? 0,
      cardsReviewedThisWeek: await this.dailyStatsRepository.getCardsReviewedThisWeek(profileId),
    };
  }

  private generateUserInfo() {
    return { sub: uuidv4() };
  }
}

export default new UserService(
  userRepository,
  streakStatsRepository,
  dailyStatsRepository,
  authProvider
);
