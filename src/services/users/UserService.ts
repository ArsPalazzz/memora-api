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
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import authProvider, { AuthProvider } from '../../providers/auth/AuthProvider';
import {
  GET_CARD_NUMBER_BY_DAY,
  GOAL_ADJUSTMENT_STEP,
  MAX_CARDS_DAILY,
  MIN_CARDS_DAILY,
  UserRole,
} from './user.const';
import streakStatsRepository, {
  StreakStatsRepository,
} from '../../databases/postgre/entities/user/StreakStatsRepository';
import dailyStatsRepository, {
  DailyStatsRepository,
} from '../../databases/postgre/entities/user/DailyStatsRepository';

export class UserService {
  constructor(
    public userRepository: UserRepository,
    public streakStatsRepository: StreakStatsRepository,
    public dailyStatsRepository: DailyStatsRepository,
    public authProvider: AuthProvider
  ) {}

  async createUser(params: CreateUserPayload) {
    const exists = await this.userRepository.existByEmail(params.email);
    if (exists) {
      throw new Error('User with this email is already exist');
    }

    const userInfo = this.generateUserInfo();
    const passwordHash = await this.authProvider.createPasswordHash(params.pass);

    const userData = { ...userInfo, email: params.email, role: UserRole.REGISTERED };

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

  private generateUserInfo() {
    const sub = uuidv4();
    const nickname = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });

    return { sub, nickname };
  }
}

export default new UserService(
  userRepository,
  streakStatsRepository,
  dailyStatsRepository,
  authProvider
);
