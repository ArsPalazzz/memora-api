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
          INNER JOIN cards.card c ON c.sub = ucs.card_sub
          INNER JOIN cards.desk d ON d.sub = c.desk_sub
          WHERE ucs.next_review <= NOW()
            AND d.status = 'active'
        GROUP BY ucs.user_sub
        HAVING COUNT(*) >= 5
`;

export const GET_DUE_COUNT_FOR_USER = `
  SELECT COUNT(*)::int AS due_count
  FROM cards.user_card_srs ucs
  INNER JOIN cards.card c ON c.sub = ucs.card_sub
  INNER JOIN cards.desk d ON d.sub = c.desk_sub
  WHERE ucs.user_sub = $1
    AND ucs.next_review <= NOW()
    AND d.status = 'active'
    AND d.creator_sub = $1
`;

export const GET_DUE_COUNT_BY_DESK = `
  SELECT
    d.sub AS desk_sub,
    d.title,
    COUNT(*)::int AS due_count
  FROM cards.user_card_srs ucs
  INNER JOIN cards.card c ON c.sub = ucs.card_sub
  INNER JOIN cards.desk d ON d.sub = c.desk_sub
  WHERE ucs.user_sub = $1
    AND ucs.next_review <= NOW()
    AND d.status = 'active'
    AND d.creator_sub = $1
  GROUP BY d.sub, d.title
  HAVING COUNT(*) > 0
  ORDER BY due_count DESC, d.title ASC
`;
