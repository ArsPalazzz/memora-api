"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCtr = authCtr;
exports.authMeCtr = authMeCtr;
exports.refreshCtr = refreshCtr;
exports.logoutCtr = logoutCtr;
const AuthService_1 = __importDefault(require("../../../services/auth/AuthService"));
const http_errors_1 = __importDefault(require("http-errors"));
const signInDtoSchema = __importStar(require("./schemas/signInDto.json"));
const utils_1 = require("../../../utils");
const validateSignInDto = utils_1.ajv.compile(signInDtoSchema);
async function authCtr(req, res, next) {
    try {
        if (!validateSignInDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect sign in params', {
                errors: validateSignInDto.errors,
            }));
        }
        const body = req.body;
        const { accessToken, refreshToken } = await AuthService_1.default.login(body);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken });
    }
    catch (e) {
        if (e instanceof Error) {
            if (e.message.includes('AuthService')) {
                return next((0, http_errors_1.default)(401, e.message));
            }
        }
        next(e);
    }
}
async function authMeCtr(req, res, next) {
    try {
        const refreshToken = req.cookies.refreshToken;
        const result = await AuthService_1.default.isAuthenticated(refreshToken);
        res.json({ result });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.message.includes('Not authenticated')) {
                return next((0, http_errors_1.default)(401, err.message));
            }
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
}
async function refreshCtr(req, res, next) {
    try {
        const oldRefresh = req.cookies.refreshToken;
        if (!oldRefresh)
            return next((0, http_errors_1.default)(401, 'No refresh token'));
        const { accessToken, refreshToken: newRefresh } = await AuthService_1.default.refreshSession(oldRefresh);
        res.cookie('refreshToken', newRefresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken });
    }
    catch (e) {
        next((0, http_errors_1.default)(401, `Refresh failed: ${e}`));
    }
}
async function logoutCtr(req, res, next) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (e) {
        next((0, http_errors_1.default)(500, 'Logout failed'));
    }
}
