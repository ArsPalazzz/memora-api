"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const GameSessionCardRepository_1 = __importDefault(require("../../databases/postgre/entities/game/GameSessionCardRepository"));
const GameSessionRepository_1 = __importDefault(require("../../databases/postgre/entities/game/GameSessionRepository"));
const exceptions_1 = require("../../exceptions");
const CardService_1 = __importDefault(require("../cards/CardService"));
const uuid_1 = require("uuid");
class GameService {
    constructor(gameSessionRepository, gameSessionCardRepository, cardService) {
        this.gameSessionRepository = gameSessionRepository;
        this.gameSessionCardRepository = gameSessionCardRepository;
        this.cardService = cardService;
    }
    async startGameSession(userSub, deskSub) {
        const sessionId = (0, uuid_1.v4)();
        const tx = await this.gameSessionCardRepository.startTransaction();
        try {
            await this.gameSessionRepository.create(sessionId, userSub, deskSub, tx);
            const deskSettings = await this.cardService.getDeskSettings(deskSub);
            if (!deskSettings) {
                throw new Error('Desk settings not found');
            }
            const { cards_per_session, card_orientation } = deskSettings;
            const cards = await this.cardService.getCardSubsForPlay(deskSub, cards_per_session);
            for (const c of cards) {
                const direction = this.resolveDirection(card_orientation);
                await this.gameSessionCardRepository.create(sessionId, c.sub, direction, tx);
            }
            await this.cardService.updateLastTimePlayedDesk(deskSub, tx);
            await tx.commit();
        }
        catch (e) {
            await tx.rollback();
            throw e;
        }
        return { sessionId };
    }
    async getNextCard(userSub, sessionId) {
        const existSession = await this.gameSessionRepository.existBySessionId(sessionId);
        if (!existSession) {
            throw new exceptions_1.NotFoundError(`Session not found by id = ${sessionId}`);
        }
        const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
        if (!haveAccess) {
            throw new exceptions_1.NotFoundError(`User with sub = ${userSub} cannot get access to session with id = ${sessionId}`);
        }
        const card = await this.gameSessionCardRepository.getNextInSessionCard(sessionId);
        if (!card) {
            throw new exceptions_1.BadRequestError(`Session with id = ${sessionId} is already completed`);
        }
        return card;
    }
    async answerCard(params) {
        const { sessionId, userSub, answer } = params;
        const exist = await this.gameSessionRepository.existBySessionId(sessionId);
        if (!exist) {
            throw new exceptions_1.NotFoundError(`Game session with id = ${sessionId} not found`);
        }
        const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError(`User with sub = ${userSub} don't have access to game session with id = ${sessionId}`);
        }
        const isActive = await this.gameSessionRepository.isActive(sessionId);
        if (!isActive) {
            throw new exceptions_1.BadRequestError(`Session with id = ${sessionId} is not active`);
        }
        const card = await this.gameSessionRepository.getNextUnansweredCard({
            sessionId,
            userSub,
        });
        if (!card) {
            throw new exceptions_1.NotFoundError('No active card in session');
        }
        const { sessionCardId, direction, frontVariants, backVariants } = card;
        const correctVariants = direction === 'front_to_back' ? backVariants : frontVariants;
        const normalizedAnswer = this.normalize(answer);
        const isCorrect = correctVariants.some((variant) => this.normalize(variant) === normalizedAnswer);
        const quality = this.calculateQuality(isCorrect);
        await this.gameSessionRepository.saveAnswer({
            sessionCardId,
            answer,
            isCorrect,
            quality,
        });
        const hasMore = await this.gameSessionRepository.hasUnansweredCards(sessionId);
        if (!hasMore) {
            await this.gameSessionRepository.finish(sessionId);
        }
        return {
            isCorrect,
            finished: !hasMore,
            correctVariants,
        };
    }
    async finishGameSession(params) {
        const { sessionId, userSub } = params;
        const exist = await this.gameSessionRepository.existBySessionId(sessionId);
        if (!exist) {
            throw new exceptions_1.NotFoundError(`Game session with id = ${sessionId} not found`);
        }
        const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError(`User with sub = ${userSub} don't have access to game session with id = ${sessionId}`);
        }
        const isActive = await this.gameSessionRepository.isActive(sessionId);
        if (!isActive) {
            throw new exceptions_1.BadRequestError(`Session with id = ${sessionId} is not active`);
        }
        await this.gameSessionRepository.finish(sessionId);
    }
    calculateQuality(isCorrect) {
        // TODO: Change
        return isCorrect ? 5 : 2;
    }
    normalize(value) {
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }
    resolveDirection(deskOrientation) {
        if (deskOrientation === 'normal')
            return 'front_to_back';
        if (deskOrientation === 'reversed')
            return 'back_to_front';
        return Math.random() < 0.5 ? 'front_to_back' : 'back_to_front';
    }
}
exports.GameService = GameService;
exports.default = new GameService(GameSessionRepository_1.default, GameSessionCardRepository_1.default, CardService_1.default);
