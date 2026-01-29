export const EXIST_RECENT_BATCH = `
   SELECT EXISTS (SELECT 1
        FROM reviews.review_batch rb
        WHERE rb.user_sub = $1
        AND rb.created_at > NOW() - INTERVAL '3 hours'
        LIMIT 1);
`;

export const CREATE_BATCH = `
  INSERT INTO reviews.review_batch (id, user_sub)
  VALUES (gen_random_uuid(), $1)
  RETURNING id
`;

export const ADD_CARDS_TO_BATCH = `
  INSERT INTO reviews.review_batch_card (batch_id, card_sub)
  SELECT $1, card_sub
  FROM cards.user_card_srs
  WHERE user_sub = $2
  AND next_review <= NOW()
  ORDER BY next_review ASC
  LIMIT 15
`;

export const MARK_BATCH_AS_NOTIFIED = `
  UPDATE reviews.review_batch
  SET notified_at = NOW()
  WHERE id = $1
`;

export const GET_BATCH_CARDS = `
 SELECT card_sub
        FROM reviews.review_batch_card
        WHERE batch_id = $1
        ORDER BY id ASC
`;
export const GET_BATCH_CARDS_FOR_USER = `
SELECT rbc.card_sub
FROM reviews.review_batch_card rbc
JOIN cards.card c
  ON c.sub = rbc.card_sub
JOIN cards.desk d
  ON d.sub = c.desk_sub
WHERE rbc.batch_id = $1
  AND d.creator_sub = $2
ORDER BY rbc.id ASC;
`;
