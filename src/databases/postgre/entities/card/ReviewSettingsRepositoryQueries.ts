export const EXIST_REVIEW_SETTINGS_BY_USER_SUB = `
    SELECT EXISTS ( SELECT 1 FROM cards.review_settings WHERE user_sub = $1 );
`;

export const GET_REVIEW_SETTINGS_BY_USER_SUB = `
    SELECT cards_per_session, study_mode FROM cards.review_settings WHERE user_sub = $1;
`;

export const CREATE_REVIEW_SETTINGS = `
    INSERT INTO cards.review_settings (user_sub) VALUES ($1);
`;

export const UPDATE_REVIEW_SETTINGS = `
    UPDATE cards.review_settings
    SET cards_per_session = $1, study_mode = $2
    WHERE user_sub = $3;
`;
