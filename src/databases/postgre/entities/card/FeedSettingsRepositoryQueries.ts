export const EXIST_FEED_SETTINGS_BY_USER_SUB = `
    SELECT EXISTS ( SELECT 1 FROM cards.feed_settings WHERE user_sub = $1 );
`;

export const GET_FEED_SETTINGS_BY_USER_SUB = `
    SELECT card_orientation FROM cards.feed_settings WHERE user_sub = $1;
`;

export const CREATE_FEED_SETTINGS = `
    INSERT INTO cards.feed_settings (user_sub) VALUES ($1);
`;
