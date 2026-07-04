export const GET_DESK_SETTINGS_BY_SUB = `
    SELECT cards_per_session, card_orientation, front_language, back_language, example_language
    FROM cards.desk_settings
    WHERE desk_sub = $1
`;
