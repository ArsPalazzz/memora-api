"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTokenCtr = saveTokenCtr;
exports.deleteTokenCtr = deleteTokenCtr;
const NotificationService_1 = __importDefault(require("../../../services/notifications/NotificationService"));
async function saveTokenCtr(req, res, next) {
    try {
        const { token, deviceInfo = {} } = req.body;
        const userSub = res.locals.userSub;
        await NotificationService_1.default.saveToken(userSub, token, deviceInfo);
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
}
async function deleteTokenCtr(req, res, next) {
    try {
        const { token } = req.body;
        const userSub = res.locals.userSub;
        await NotificationService_1.default.deleteToken(userSub, token);
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
}
