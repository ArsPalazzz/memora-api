"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardExampleRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const CardExampleRepositoryQueries_1 = require("./CardExampleRepositoryQueries");
class CardExampleRepository extends Table_1.default {
    async createMany(params) {
        if (!params.sentences.length)
            return [];
        const queryText = (0, CardExampleRepositoryQueries_1.INSERT_CARD_EXAMPLES)(params.sentences.length);
        const values = [params.cardSub, ...params.sentences];
        const query = {
            name: 'createCardExamples',
            text: queryText,
            values: values,
        };
        return this.insertItem(query);
    }
}
exports.CardExampleRepository = CardExampleRepository;
exports.default = new CardExampleRepository();
