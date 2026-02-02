"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_CARD_NUMBER_BY_DAY = exports.GOAL_ADJUSTMENT_STEP = exports.MAX_CARDS_DAILY = exports.MIN_CARDS_DAILY = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["REGISTERED"] = "registered";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.MIN_CARDS_DAILY = 20;
exports.MAX_CARDS_DAILY = 200;
exports.GOAL_ADJUSTMENT_STEP = 5;
const GET_CARD_NUMBER_BY_DAY = (day) => 20 + (day - 1) * exports.GOAL_ADJUSTMENT_STEP;
exports.GET_CARD_NUMBER_BY_DAY = GET_CARD_NUMBER_BY_DAY;
