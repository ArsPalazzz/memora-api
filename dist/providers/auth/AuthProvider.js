"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../../config");
const { secret, expiresIn } = config_1.jwtConfig;
class AuthProvider {
    constructor(secret, expiresIn) {
        this.secret = secret;
        this.expiresIn = expiresIn;
    }
    async validateToken(token) {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, this.secret, (err, payload) => {
                if (err) {
                    reject(err);
                }
                resolve(payload);
            });
        });
    }
    async createAccessToken(payload) {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.sign(payload, this.secret, { expiresIn: '15m' }, (err, token) => err || !token ? reject(err) : resolve(token));
        });
    }
    async createRefreshToken(payload) {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.sign(payload, this.secret, { expiresIn: '30d' }, (err, token) => err || !token ? reject(err) : resolve(token));
        });
    }
    async createPasswordHash(password) {
        const SALT_ROUNDS = 10;
        return bcryptjs_1.default.hash(password, SALT_ROUNDS);
    }
    async validatePassword(loginPassword, hashedPassword) {
        return bcryptjs_1.default.compare(loginPassword, hashedPassword);
    }
}
exports.AuthProvider = AuthProvider;
exports.default = new AuthProvider(secret, expiresIn);
