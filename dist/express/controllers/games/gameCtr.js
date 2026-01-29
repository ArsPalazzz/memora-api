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
exports.startDeskSessionCtr = startDeskSessionCtr;
exports.startReviewSessionCtr = startReviewSessionCtr;
exports.answerInGameSessionCtr = answerInGameSessionCtr;
exports.gradeCardInGameSessionCtr = gradeCardInGameSessionCtr;
exports.getNextCardCtr = getNextCardCtr;
exports.finishGameSessionCtr = finishGameSessionCtr;
exports.startFeedSessionCtr = startFeedSessionCtr;
exports.swipeCardCtr = swipeCardCtr;
exports.feedNextCardCtr = feedNextCardCtr;
exports.cardShownCtr = cardShownCtr;
exports.addCardToDeskCtr = addCardToDeskCtr;
const http_errors_1 = __importDefault(require("http-errors"));
const startDeskSessionBodyDtoSchema = __importStar(require("./schemas/startDeskSessionBodyDto.json"));
const startReviewSessionBodyDtoSchema = __importStar(require("./schemas/startReviewSessionBodyDto.json"));
const answerInGameSessionBodyDtoSchema = __importStar(require("./schemas/answerInGameSessionBodyDto.json"));
const gradeCardInGameSessionBodyDtoSchema = __importStar(require("./schemas/gradeCardInGameSessionBodyDto.json"));
const getNextCardBodyDtoSchema = __importStar(require("./schemas/getNextCardBodyDto.json"));
const utils_1 = require("../../../utils");
const GameService_1 = __importDefault(require("../../../services/games/GameService"));
const validateStartDeskSessionBodyDto = utils_1.ajv.compile(startDeskSessionBodyDtoSchema);
const validateStartReviewSessionBodyDto = utils_1.ajv.compile(startReviewSessionBodyDtoSchema);
const validateAnswerInGameSessionBodyDto = utils_1.ajv.compile(answerInGameSessionBodyDtoSchema);
const validateGradeCardInGameSessionBodyDto = utils_1.ajv.compile(gradeCardInGameSessionBodyDtoSchema);
const validateGetNextCardBodyDto = utils_1.ajv.compile(getNextCardBodyDtoSchema);
async function startDeskSessionCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        if (!validateStartDeskSessionBodyDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect start desk session body', {
                errors: validateStartDeskSessionBodyDto.errors,
            }));
        }
        const { deskSub } = req.body;
        const { sessionId } = await GameService_1.default.startGameSession(userSub, deskSub);
        res.json({ sessionId });
    }
    catch (e) {
        next(e);
    }
}
async function startReviewSessionCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        if (!validateStartReviewSessionBodyDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect start review session body', {
                errors: validateStartReviewSessionBodyDto.errors,
            }));
        }
        const { batchId } = req.body;
        const { sessionId } = await GameService_1.default.startReviewSession(userSub, batchId);
        res.json({ sessionId });
    }
    catch (e) {
        next(e);
    }
}
async function answerInGameSessionCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        if (!validateAnswerInGameSessionBodyDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect answer in game session body', {
                errors: validateAnswerInGameSessionBodyDto.errors,
            }));
        }
        const { sessionId, answer } = req.body;
        const result = await GameService_1.default.answerCard({
            sessionId,
            userSub,
            answer,
        });
        res.json(result);
    }
    catch (e) {
        next(e);
    }
}
async function gradeCardInGameSessionCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        if (!validateGradeCardInGameSessionBodyDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect grade card in game session body', {
                errors: validateGradeCardInGameSessionBodyDto.errors,
            }));
        }
        const { sessionId, quality } = req.body;
        await GameService_1.default.gradeCard({ sessionId, userSub, quality });
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
}
async function getNextCardCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        if (!validateGetNextCardBodyDto(req.query)) {
            return next((0, http_errors_1.default)(422, 'Incorrect get next card body', {
                errors: validateGetNextCardBodyDto.errors,
            }));
        }
        const { sessionId } = req.query;
        const card = await GameService_1.default.getNextCard(userSub, sessionId);
        res.json(card);
    }
    catch (e) {
        next(e);
    }
}
async function finishGameSessionCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        if (!validateGetNextCardBodyDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect answer in game session body', {
                errors: validateGetNextCardBodyDto.errors,
            }));
        }
        const { sessionId } = req.body;
        await GameService_1.default.finishGameSession({ sessionId, userSub });
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
}
async function startFeedSessionCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        const { sessionId } = await GameService_1.default.startFeedSession(userSub);
        res.json({ sessionId });
    }
    catch (e) {
        next(e);
    }
}
async function swipeCardCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        // if (!validateSwipeCardBodyDto(req.body)) {
        //   return next(
        //     createError(422, 'Incorrect swipe card body', {
        //       errors: validateSwipeCardBodyDto.errors,
        //     })
        //   );
        // }
        const { sessionId, cardSub, action, deskSub } = req.body;
        await GameService_1.default.swipeCard({ userSub, sessionId, cardSub, action, deskSub });
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
}
async function feedNextCardCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        // if (!validateFeedNextCardBodyDto(req.query)) {
        //   return next(
        //     createError(422, 'Incorrect feed next card body', {
        //       errors: validateFeedNextCardBodyDto.errors,
        //     })
        //   );
        // }
        const { sessionId } = req.query;
        const card = await GameService_1.default.getFeedNextCard(userSub, sessionId);
        res.json(card);
    }
    catch (e) {
        next(e);
    }
}
async function cardShownCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        // if (!validateFeedNextCardBodyDto(req.query)) {
        //   return next(
        //     createError(422, 'Incorrect feed next card body', {
        //       errors: validateFeedNextCardBodyDto.errors,
        //     })
        //   );
        // }
        const { cardSub, sessionId } = req.body;
        const card = await GameService_1.default.cardShown(userSub, sessionId, cardSub);
        res.json(card);
    }
    catch (e) {
        next(e);
    }
}
async function addCardToDeskCtr(req, res, next) {
    try {
        const userSub = res.locals.userSub;
        const { cardSub, deskSubs } = req.body;
        await GameService_1.default.addCardToDesk(userSub, cardSub, deskSubs);
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
}
