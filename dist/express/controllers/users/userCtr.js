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
exports.createUserCtr = createUserCtr;
exports.getMyProfileCtr = getMyProfileCtr;
exports.getDailyCtr = getDailyCtr;
const UserService_1 = __importDefault(require("../../../services/users/UserService"));
const CardService_1 = __importDefault(require("../../../services/cards/CardService"));
const utils_1 = require("../../../utils");
const http_errors_1 = __importDefault(require("http-errors"));
const createUserDtoSchema = __importStar(require("./schemas/createUserDto.json"));
const validateCreateUserDto = utils_1.ajv.compile(createUserDtoSchema);
async function createUserCtr(req, res, next) {
    try {
        if (!validateCreateUserDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect user body', {
                errors: validateCreateUserDto.errors,
            }));
        }
        const { email, password } = req.body;
        const user = await UserService_1.default.createUser({ email, pass: password });
        await CardService_1.default.createFeedSettings(user.sub);
        await CardService_1.default.createReviewSettings(user.sub);
        res.json(user);
    }
    catch (e) {
        if (e instanceof Error) {
            if (e.message.includes('with this email')) {
                return next((0, http_errors_1.default)(400, e.message));
            }
        }
        next(e);
    }
}
async function getMyProfileCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        const profile = await UserService_1.default.getProfile({ sub: userSub });
        const settings = await CardService_1.default.getFeedSettingsByUserSub(userSub);
        const reviewSettings = await CardService_1.default.getReviewSettingsByUserSub(userSub);
        res.json({ profile, settings: { ...settings, reviewSettings } });
    }
    catch (e) {
        next(e);
    }
}
async function getDailyCtr(req, res, next) {
    try {
        const daily = await UserService_1.default.getDaily({ sub: res.locals.userSub });
        res.json(daily);
    }
    catch (e) {
        next(e);
    }
}
