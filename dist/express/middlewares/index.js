"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenValidator = tokenValidator;
const http_errors_1 = __importDefault(require("http-errors"));
const AuthProvider_1 = __importDefault(require("../../providers/auth/AuthProvider"));
async function tokenValidator(req, res, next) {
    try {
        const { authorization = 'Is empty' } = req.headers;
        const [, token] = authorization.split(' ');
        const tokenPayload = await AuthProvider_1.default.validateToken(token);
        res.locals.userSub = tokenPayload.sub;
        res.locals.userRole = tokenPayload.role;
        next();
    }
    catch (e) {
        if (e instanceof Error && e.message.includes('cannot get')) {
            return next((0, http_errors_1.default)(404, e.message));
        }
        res.set('WWW-Authenticate', 'Bearer');
        next((0, http_errors_1.default)(401, 'Authentication required'));
    }
}
