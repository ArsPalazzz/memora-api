"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const UserRepository_1 = __importDefault(require("../../databases/postgre/entities/user/UserRepository"));
const uuid_1 = require("uuid");
const unique_names_generator_1 = require("unique-names-generator");
const AuthProvider_1 = __importDefault(require("../../providers/auth/AuthProvider"));
const user_const_1 = require("./user.const");
const StreakStatsRepository_1 = __importDefault(require("../../databases/postgre/entities/user/StreakStatsRepository"));
const DailyStatsRepository_1 = __importDefault(require("../../databases/postgre/entities/user/DailyStatsRepository"));
class UserService {
    constructor(userRepository, streakStatsRepository, dailyStatsRepository, authProvider) {
        this.userRepository = userRepository;
        this.streakStatsRepository = streakStatsRepository;
        this.dailyStatsRepository = dailyStatsRepository;
        this.authProvider = authProvider;
    }
    async createUser(params) {
        const exists = await this.userRepository.existByEmail(params.email);
        if (exists) {
            throw new Error('User with this email is already exist');
        }
        const userInfo = this.generateUserInfo();
        const passwordHash = await this.authProvider.createPasswordHash(params.pass);
        const userData = { ...userInfo, email: params.email, role: user_const_1.UserRole.REGISTERED };
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
    async getProfile(params) {
        const exists = await this.userRepository.existBySub(params.sub);
        if (!exists) {
            throw new Error("User with this sub doesn't exist");
        }
        return await this.userRepository.getProfileBySub(params.sub);
    }
    async getProfileId(sub) {
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
    async addCardInDaily(userId) {
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
                dailyGoal: (0, user_const_1.GET_CARD_NUMBER_BY_DAY)(streakStats.current_streak),
                goalAchieved: false,
            });
        }
        else {
            dailyStat.cards_reviewed += 1;
            dailyStat.goal_achieved = dailyStat.cards_reviewed >= dailyStat.daily_goal;
            await this.dailyStatsRepository.incrementCardsReviewed(dailyStat.id);
        }
    }
    async getDaily(params) {
        const profile = await this.userRepository.getProfileIdBySub(params.sub);
        if (!profile) {
            throw new Error(`Profile not found`);
        }
        const exists = await this.dailyStatsRepository.existByUserId({ userId: profile.id });
        if (!exists) {
            return {
                currentStreak: 1,
                dailyGoal: user_const_1.MIN_CARDS_DAILY,
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
                newGoal = Math.min(lastDaily.daily_goal + user_const_1.GOAL_ADJUSTMENT_STEP, user_const_1.MAX_CARDS_DAILY);
            }
            else {
                newGoal = user_const_1.MIN_CARDS_DAILY;
            }
        }
        return {
            currentStreak: streak.current_streak,
            dailyGoal: newGoal,
            cardsReviewed: lastDate.toDateString() === today.toDateString() ? lastDaily.cards_reviewed : 0,
        };
    }
    async existProfile(params) {
        const exists = await this.userRepository.existBySub(params.sub);
        if (!exists) {
            throw new Error("User with this sub doesn't exist");
        }
        return true;
    }
    generateUserInfo() {
        const sub = (0, uuid_1.v4)();
        const nickname = (0, unique_names_generator_1.uniqueNamesGenerator)({ dictionaries: [unique_names_generator_1.adjectives, unique_names_generator_1.colors, unique_names_generator_1.animals] });
        return { sub, nickname };
    }
}
exports.UserService = UserService;
exports.default = new UserService(UserRepository_1.default, StreakStatsRepository_1.default, DailyStatsRepository_1.default, AuthProvider_1.default);
