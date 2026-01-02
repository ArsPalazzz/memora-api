"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardService = void 0;
const CardRepository_1 = __importDefault(require("../../databases/postgre/entities/card/CardRepository"));
const DeskSettingsRepository_1 = __importDefault(require("../../databases/postgre/entities/card/DeskSettingsRepository"));
const exceptions_1 = require("../../exceptions");
const uuid_1 = require("uuid");
class CardService {
    constructor(cardRepository, deskSettingsRepository) {
        this.cardRepository = cardRepository;
        this.deskSettingsRepository = deskSettingsRepository;
    }
    async getAllCards() {
        return await this.cardRepository.getCards();
    }
    async getDeskSettings(deskSub) {
        return await this.deskSettingsRepository.getByDeskSub(deskSub);
    }
    async updateLastTimePlayedDesk(deskSub, tx) {
        await this.cardRepository.updateLastTimePlayedDesk(deskSub, tx);
    }
    async getUserDesks(userSub) {
        return await this.cardRepository.getDesksByCreatorSub(userSub);
    }
    async getDesk(payload) {
        const { desk_sub, sub } = payload;
        const exist = await this.cardRepository.existDesk({ sub: desk_sub });
        if (!exist) {
            throw new exceptions_1.NotFoundError(`CardService: desk with sub = ${desk_sub} not found`);
        }
        const haveAccess = await this.cardRepository.haveAccessToDesk({ desk_sub, user_sub: sub });
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError(`CardService: user with sub = ${sub} doesn't have access to desk with id = ${desk_sub}`);
        }
        return await this.cardRepository.getDeskDetails({ sub: desk_sub });
    }
    async createCard(payload) {
        const deskExist = await this.cardRepository.existDesk({ sub: payload.desk_sub });
        if (!deskExist) {
            throw new exceptions_1.NotFoundError(`CardService: desk with sub = ${payload.desk_sub} not found`);
        }
        const sub = (0, uuid_1.v4)();
        return await this.cardRepository.createCard({ sub, ...payload });
    }
    async createDesk(payload) {
        const created_at = await this.cardRepository.createDesk(payload);
        return { sub: payload.sub, title: payload.title, description: payload.description, created_at };
    }
    async updateDesk(payload) {
        const { deskSub, body, creatorSub } = payload;
        const exist = await this.cardRepository.existDesk({ sub: deskSub });
        if (!exist) {
            throw new exceptions_1.NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
        }
        const haveAccess = await this.cardRepository.haveAccessToDesk({
            user_sub: creatorSub,
            desk_sub: deskSub,
        });
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError(`CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`);
        }
        await this.cardRepository.updateDesk({
            desk_sub: deskSub,
            payload: body,
        });
    }
    async updateCard(payload) {
        const { cardSub, body, creatorSub } = payload;
        const exist = await this.cardRepository.existCardBySub({ sub: cardSub });
        if (!exist) {
            throw new exceptions_1.NotFoundError(`CardService: card with sub = ${cardSub} not found`);
        }
        const haveAccess = await this.cardRepository.haveAccessToCard({
            user_sub: creatorSub,
            card_sub: cardSub,
        });
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError(`CardService: user with sub = ${creatorSub} cannot update card with sub = ${cardSub}`);
        }
        await this.cardRepository.updateCard({
            card_sub: cardSub,
            payload: body,
        });
    }
    async getCardSubsForPlay(deskSub, cardsPerSession) {
        return await this.cardRepository.getCardSubsForPlay(deskSub, cardsPerSession);
    }
    async archiveDesk(payload) {
        const { deskSub, creatorSub } = payload;
        const exist = await this.cardRepository.existDesk({ sub: deskSub });
        if (!exist) {
            throw new exceptions_1.NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
        }
        const haveAccess = await this.cardRepository.haveAccessToDesk({
            user_sub: creatorSub,
            desk_sub: deskSub,
        });
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError(`CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`);
        }
        await this.cardRepository.archiveDesk({ desk_sub: deskSub });
    }
    async updateDeskSettings(payload) {
        const { deskSub, body, creatorSub } = payload;
        const exist = await this.cardRepository.existDesk({ sub: deskSub });
        if (!exist) {
            throw new exceptions_1.NotFoundError(`CardService: desk with sub = ${deskSub} not found`);
        }
        const haveAccess = await this.cardRepository.haveAccessToDesk({
            user_sub: creatorSub,
            desk_sub: deskSub,
        });
        if (!haveAccess) {
            throw new exceptions_1.ForbiddenError(`CardService: user with sub = ${creatorSub} cannot update desk settings with desk sub = ${deskSub}`);
        }
        await this.cardRepository.updateDeskSettings({
            desk_sub: deskSub,
            payload: body,
        });
    }
}
exports.CardService = CardService;
exports.default = new CardService(CardRepository_1.default, DeskSettingsRepository_1.default);
