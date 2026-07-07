export const EXIST_RECENT_NOTIFICATION = `
  SELECT EXISTS (
    SELECT 1
    FROM reviews.review_batch rb
    WHERE rb.user_sub = $1
      AND rb.notified_at > NOW() - INTERVAL '3 hours'
    LIMIT 1
  );
`;

export const DELETE_BATCH = `
  DELETE FROM reviews.review_batch
  WHERE id = $1
    AND notified_at IS NULL
`;

export const CREATE_BATCH = `
  INSERT INTO reviews.review_batch (id, user_sub)
  VALUES (gen_random_uuid(), $1)
  RETURNING id
`;

export const ADD_DUE_CARDS_TO_BATCH = `
  INSERT INTO reviews.review_batch_card (batch_id, card_sub)
  SELECT $1, ucs.card_sub
  FROM cards.user_card_srs ucs
  INNER JOIN cards.card c ON c.sub = ucs.card_sub
  INNER JOIN cards.desk d ON d.sub = c.desk_sub
  WHERE ucs.user_sub = $2
    AND ucs.next_review <= NOW()
    AND d.status = 'active'
    AND d.creator_sub = $2
  ORDER BY ucs.next_review ASC
  LIMIT $3
`;

export const ADD_INBOX_CARDS_TO_BATCH = `
  INSERT INTO reviews.review_batch_card (batch_id, card_sub)
  SELECT $1, c.sub
  FROM cards.card c
  INNER JOIN cards.desk d ON d.sub = c.desk_sub
  LEFT JOIN cards.user_card_srs ucs
    ON ucs.card_sub = c.sub
   AND ucs.user_sub = $2
  WHERE d.creator_sub = $2
    AND d.is_inbox = true
    AND d.status = 'active'
    AND (ucs.repetitions IS NULL OR ucs.repetitions = 0)
    AND NOT EXISTS (
      SELECT 1
      FROM reviews.review_batch_card rbc
      WHERE rbc.batch_id = $1
        AND rbc.card_sub = c.sub
    )
  ORDER BY c.created_at ASC
  LIMIT $3
`;

export const GET_BATCH_CARD_COUNT = `
  SELECT COUNT(*)::int AS card_count
  FROM reviews.review_batch_card
  WHERE batch_id = $1
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
