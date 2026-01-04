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
class UserService {
    constructor(userRepository, authProvider) {
        this.userRepository = userRepository;
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
        await this.userRepository.createUser({
            ...userData,
            passwordHash,
        });
        return { ...userData, password: params.pass };
    }
    async getProfile(params) {
        const exists = await this.userRepository.existBySub(params.sub);
        if (!exists) {
            throw new Error("User with this sub doesn't exist");
        }
        return await this.userRepository.getProfileBySub(params.sub);
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
exports.default = new UserService(UserRepository_1.default, AuthProvider_1.default);
