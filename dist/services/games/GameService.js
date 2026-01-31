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
const ReviewService_1 = __importDefault(require("../reviews/ReviewService"));
const uuid_1 = require("uuid");
const UserService_1 = __importDefault(require("../users/UserService"));
class GameService {
    constructor(gameSessionRepository, gameSessionCardRepository, cardService, reviewService, userService) {
        this.gameSessionRepository = gameSessionRepository;
        this.gameSessionCardRepository = gameSessionCardRepository;
        this.cardService = cardService;
        this.reviewService = reviewService;
        this.userService = userService;
    }
    async startGameSession(userSub, deskSub) {
        const sessionId = (0, uuid_1.v4)();
        const tx = await this.gameSessionCardRepository.startTransaction();
        try {
            await this.gameSessionRepository.create(sessionId, userSub, deskSub, tx);
            const deskSettings = await this.cardService.getDeskSettings(deskSub);
            if (!deskSettings) {
                throw new Error('Deck settings not found');
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
    async startReviewSession(userSub, batchId) {
        const batchCards = await this.reviewService.getBatchCardsForUser(batchId, userSub);
        if (batchCards.length === 0) {
            throw new Error('No cards in batch or batch already reviewed');
        }
        const sessionId = (0, uuid_1.v4)();
        const tx = await this.gameSessionCardRepository.startTransaction();
        try {
            await this.gameSessionRepository.createReview(sessionId, userSub, batchId, tx);
            const cardSubs = await this.reviewService.getCardSubsByBatchId(batchId);
            for (const sub of cardSubs) {
                const direction = this.resolveDirection('normal');
                await this.gameSessionCardRepository.create(sessionId, sub, direction, tx);
            }
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
        return {
            card: {
                sub: card.sub,
                text: card.text,
            },
            progress: {
                current: card.current_position,
                total: card.total_cards,
            },
        };
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
        await this.gameSessionRepository.saveAnswer({
            sessionCardId,
            answer,
            isCorrect,
        });
        if (isCorrect) {
            const userId = await this.userService.getProfileId(userSub);
            await this.userService.addCardInDaily(userId);
        }
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
    async gradeCard(params) {
        const { sessionId, userSub, quality } = params;
        const exist = await this.gameSessionRepository.existBySessionId(sessionId);
        if (!exist)
            throw new exceptions_1.NotFoundError('Session not found');
        const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
        if (!haveAccess)
            throw new exceptions_1.ForbiddenError('No access to session');
        const lastCard = await this.gameSessionCardRepository.getLastAnsweredCard(sessionId);
        if (!lastCard)
            throw new exceptions_1.BadRequestError('No answered card to grade');
        await CardService_1.default.updateSrs(userSub, lastCard.cardSub, quality);
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
    async startFeedSession(userSub) {
        const sessionId = (0, uuid_1.v4)();
        await this.gameSessionRepository.createFeed(sessionId, userSub);
        return { sessionId };
    }
    async getFeedNextCard(userSub, sessionId) {
        const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
        if (!haveAccess) {
            throw new exceptions_1.NotFoundError('No access to session');
        }
        const shownCardSubs = await this.getShownCardsInSession(userSub, sessionId);
        const userPreferences = await this.getUserTopicPreferences(userSub);
        const limit = shownCardSubs.length === 0 ? 5 : 1;
        const feedSettings = await this.cardService.getFeedSettingsByUserSub(userSub);
        const cards = await this.cardService.getCardForFeed({
            userSub,
            exclude: shownCardSubs,
            preferences: userPreferences,
            limit,
            sessionId,
            cardOrientation: feedSettings.card_orientation,
        });
        if (!cards || cards.length === 0)
            return null;
        for (const card of cards) {
            await this.gameSessionCardRepository.createWithoutTx(sessionId, card.sub, card.card_direction);
        }
        return {
            cards: cards.map((c) => ({
                sub: c.sub,
                text: c.front_variants,
                backVariants: c.back_variants,
                imageUuid: c.image_uuid,
                deskTitle: c.desk_title,
                deskSub: c.desk_sub,
                globalStats: {
                    shown: c.global_shown_count,
                    liked: c.global_like_count,
                    answered: c.global_answer_count,
                },
                examples: c.examples,
            })),
        };
    }
    async cardShown(userSub, sessionId, cardSub) {
        const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
        if (!haveAccess) {
            throw new exceptions_1.NotFoundError('No access to session');
        }
        await this.cardService.recordCardShown(userSub, cardSub);
    }
    async getShownCardsInSession(userSub, sessionId) {
        return this.cardService.getShownCardsForSession(userSub, sessionId);
    }
    async recordCardShownInSession(sessionId, cardSub) {
        return this.gameSessionRepository.recordCardShown(sessionId, cardSub);
    }
    async swipeCard(params) {
        const { userSub, sessionId, cardSub, action, deskSub } = params;
        const haveAccess = await this.gameSessionRepository.haveAccessToSession(sessionId, userSub);
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError('No access to session');
        }
        await this.cardService.recordCardAction(userSub, cardSub, action);
        if (action === 'like') {
            await this.cardService.addCardToSrs(userSub, cardSub);
        }
        if (deskSub) {
            await this.cardService.addCardToDesk(userSub, cardSub, deskSub);
        }
        await this.gameSessionCardRepository.createFeedAction({
            sessionId,
            cardSub,
            action,
            deskSub,
        });
    }
    async addCardToDesk(userSub, cardSub, deskSubs) {
        const isOwner = await this.cardService.isDesksOwner(userSub, deskSubs);
        if (!isOwner) {
            throw new exceptions_1.ForbiddenError('You are not the owner of deck/decks');
        }
        await this.cardService.cloneCardToDesks(cardSub, deskSubs);
    }
    async getUserTopicPreferences(userSub) {
        const userDesks = await this.cardService.getUserDesks(userSub);
        const likedCards = await this.cardService.getLikedCards(userSub);
        const topics = new Set();
        userDesks.forEach((desk) => {
            const words = desk.title.toLowerCase().split(/\s+/);
            words.forEach((word) => {
                if (word.length > 3)
                    topics.add(word);
            });
        });
        const likedCardTopics = await this.cardService.analyzeCardTopics(likedCards);
        likedCardTopics.forEach((topic) => topics.add(topic));
        return Array.from(topics);
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
exports.default = new GameService(GameSessionRepository_1.default, GameSessionCardRepository_1.default, CardService_1.default, ReviewService_1.default, UserService_1.default);
