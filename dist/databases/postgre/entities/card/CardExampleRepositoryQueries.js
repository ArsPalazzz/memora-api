"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSERT_CARD_EXAMPLES = void 0;
const INSERT_CARD_EXAMPLES = (sentencesCount) => {
    const placeholders = Array.from({ length: sentencesCount }, (_, i) => `($1, $${i + 2})`).join(', ');
    return `
    INSERT INTO cards.card_examples (card_sub, sentence) 
    VALUES ${placeholders}
    RETURNING *;
  `;
};
exports.INSERT_CARD_EXAMPLES = INSERT_CARD_EXAMPLES;
