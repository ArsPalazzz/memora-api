"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_DESK_SETTINGS_BY_SUB = void 0;
exports.GET_DESK_SETTINGS_BY_SUB = `
    SELECT cards_per_session, card_orientation
    FROM cards.desk_settings
    WHERE desk_sub = $1
`;
