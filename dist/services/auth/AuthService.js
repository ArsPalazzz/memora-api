"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const UserRepository_1 = __importDefault(require("../../databases/postgre/entities/user/UserRepository"));
const AuthProvider_1 = __importDefault(require("../../providers/auth/AuthProvider"));
class AuthService {
    constructor(authProvider, userRepository) {
        this.authProvider = authProvider;
        this.userRepository = userRepository;
    }
    async login(credentials) {
        const user = await this.userRepository.getInfoByEmail(credentials.email);
        if (!user || !user.sub || !user.role || !user.pass_hash) {
            throw new Error(`AuthService: User with email ${credentials.email} doesn't exist`);
        }
        const hashString = Buffer.isBuffer(user.pass_hash)
            ? user.pass_hash.toString('utf-8')
            : user.pass_hash;
        const isValid = await this.authProvider.validatePassword(credentials.password, hashString);
        if (!isValid)
            throw new Error(`AuthService: User password is invalid`);
        const accessToken = await this.authProvider.createAccessToken({
            sub: user.sub,
            role: user.role,
        });
        const refreshToken = await this.authProvider.createRefreshToken({
            sub: user.sub,
            role: user.role,
        });
        return { accessToken, refreshToken };
    }
    async refreshSession(refreshToken) {
        const { exp, iat, ...cleanPayload } = await this.authProvider.validateToken(refreshToken);
        const newAccess = await this.authProvider.createAccessToken(cleanPayload);
        const newRefresh = await this.authProvider.createRefreshToken(cleanPayload);
        return { accessToken: newAccess, refreshToken: newRefresh };
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService(AuthProvider_1.default, UserRepository_1.default);
