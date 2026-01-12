export const GET_USER_CARD_SRS = `
SELECT *
      FROM cards.user_card_srs
      WHERE user_sub = $1 AND card_sub = $2
`;

export const UPSERT_USER_CARDS_SRS = `
INSERT INTO cards.user_card_srs (
        user_sub,
        card_sub,
        repetitions,
        interval_minutes,
        ease_factor,
        last_review,
        next_review
      )
      VALUES ($1,$2,$3,$4,$5,NOW(),$6)
      ON CONFLICT (user_sub, card_sub)
      DO UPDATE SET
        repetitions = $3,
        interval_minutes = $4,
        ease_factor = $5,
        last_review = NOW(),
        next_review = $6
`;

export const GET_USERS_WITH_DUE_CARDS = `
    SELECT 
        ucs.user_sub,
            COUNT(*) as due_count
        FROM cards.user_card_srs ucs
        WHERE ucs.next_review <= NOW()
        GROUP BY ucs.user_sub
        HAVING COUNT(*) >= 3
`;
