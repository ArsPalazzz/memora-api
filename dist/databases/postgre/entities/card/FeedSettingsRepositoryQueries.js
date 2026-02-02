"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREATE_FEED_SETTINGS = exports.GET_FEED_SETTINGS_BY_USER_SUB = exports.EXIST_FEED_SETTINGS_BY_USER_SUB = void 0;
exports.EXIST_FEED_SETTINGS_BY_USER_SUB = `
    SELECT EXISTS ( SELECT 1 FROM cards.feed_settings WHERE user_sub = $1 );
`;
exports.GET_FEED_SETTINGS_BY_USER_SUB = `
    SELECT card_orientation FROM cards.feed_settings WHERE user_sub = $1;
`;
exports.CREATE_FEED_SETTINGS = `
    INSERT INTO cards.feed_settings (user_sub) VALUES ($1);
`;
