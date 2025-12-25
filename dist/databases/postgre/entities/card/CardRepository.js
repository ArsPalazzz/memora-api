"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const CardRepositoryQueries_1 = require("./CardRepositoryQueries");
class CardRepository extends Table_1.default {
    async getCards() {
        const query = {
            name: 'getCards',
            text: CardRepositoryQueries_1.GET_CARDS,
            values: [],
        };
        return this.getItems(query);
    }
    async getCardsForPlay(deskSub, cards_per_session) {
        const query = {
            name: 'getCardsForPlay',
            text: CardRepositoryQueries_1.GET_CARDS_FOR_PLAY,
            values: [deskSub, cards_per_session],
        };
        return this.getItems(query);
    }
    async getDesks() {
        const query = {
            name: 'getDesks',
            text: CardRepositoryQueries_1.GET_DESKS,
            values: [],
        };
        return this.getItems(query);
    }
    async getDeskDetails(params) {
        const query = {
            name: 'getDeskDetails',
            text: CardRepositoryQueries_1.GET_DESK_DETAILS,
            values: [params.sub],
        };
        return this.getItem(query);
    }
    async createCard(params) {
        const query = {
            name: 'createCard',
            text: CardRepositoryQueries_1.INSERT_CARD,
            values: [params.desk_sub, params.front, params.back, params.sub],
        };
        return this.insertItem(query);
    }
    async existCard(params) {
        const query = {
            name: 'existCard',
            text: CardRepositoryQueries_1.EXIST_CARD,
            values: [params.id],
        };
        return this.exists(query);
    }
    async existCardBySub(params) {
        const query = {
            name: 'existCardBySub',
            text: CardRepositoryQueries_1.EXIST_CARD_BY_SUB,
            values: [params.sub],
        };
        return this.exists(query);
    }
    async existDesk(params) {
        const query = {
            name: 'existDesk',
            text: CardRepositoryQueries_1.EXIST_DESK,
            values: [params.sub],
        };
        return this.exists(query);
    }
    async updateLastTimePlayedDesk(deskSub) {
        const query = {
            name: 'updateLastTimePlayedDesk',
            text: CardRepositoryQueries_1.UPDATE_LAST_TIME_PLAYED_DESK,
            values: [deskSub],
        };
        return this.updateItems(query);
    }
    async haveAccessToDesk(params) {
        const query = {
            name: 'haveAccessToDesk',
            text: CardRepositoryQueries_1.HAVE_ACCESS_TO_DESK,
            values: [params.desk_sub, params.user_sub],
        };
        return this.exists(query);
    }
    async haveAccessToCard(params) {
        const query = {
            name: 'haveAccessToCard',
            text: CardRepositoryQueries_1.HAVE_ACCESS_TO_CARD,
            values: [params.card_sub, params.user_sub],
        };
        return this.exists(query);
    }
    async createDesk(params) {
        const tx = await this.startTransaction();
        try {
            const desk = await tx.query({
                name: 'insertDesk',
                text: CardRepositoryQueries_1.INSERT_DESK,
                values: [params.sub, params.title, params.description, params.creatorSub],
            });
            await tx.query({
                name: 'insertDeskSettings',
                text: CardRepositoryQueries_1.INSERT_DESK_SETTINGS,
                values: [params.sub],
            });
            await tx.commit();
            return desk.rows[0].created_at;
        }
        catch (e) {
            await tx.rollback();
            throw e;
        }
    }
    async updateDesk(params) {
        const query = {
            name: 'updateDesk',
            text: CardRepositoryQueries_1.UPDATE_DESK,
            values: [params.desk_sub, params.payload.title, params.payload.description],
        };
        return this.updateItems(query);
    }
    async updateCard(params) {
        const query = {
            name: 'updateCard',
            text: CardRepositoryQueries_1.UPDATE_CARD,
            values: [params.card_sub, params.payload.front, params.payload.back],
        };
        return this.updateItems(query);
    }
    async archiveDesk(params) {
        const query = {
            name: 'archiveDesk',
            text: CardRepositoryQueries_1.ARCHIVE_DESK,
            values: [params.desk_sub],
        };
        return this.updateItems(query);
    }
    async updateDeskSettings(params) {
        const query = {
            name: 'updateDeskSettings',
            text: CardRepositoryQueries_1.UPDATE_DESK_SETTINGS,
            values: [params.desk_sub, params.payload.cards_per_session, params.payload.card_orientation],
        };
        return this.updateItems(query);
    }
}
exports.CardRepository = CardRepository;
exports.default = new CardRepository();
