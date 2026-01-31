export const CREATE_GAME_SESSION_CARD = `
  INSERT INTO games.session_card(session_id, card_sub, direction, created_at)
    VALUES($1,$2,$3,NOW())`;

export const GET_NEXT_IN_SESSION_CARD = `
  WITH session_info AS (
    SELECT 
      COUNT(*) as total_cards,
      COALESCE(SUM(CASE WHEN user_answer IS NOT NULL THEN 1 ELSE 0 END), 0) as answered_cards
    FROM games.session_card
    WHERE session_id = $1
  )
  SELECT
    sc.card_sub AS sub,
    sc.direction,
    CASE
      WHEN sc.direction = 'front_to_back' THEN c.front_variants
      WHEN sc.direction = 'back_to_front' THEN c.back_variants
    END AS "text",
    si.total_cards,
    si.answered_cards + 1 as current_position
  FROM games.session_card sc
  JOIN cards.card c ON sc.card_sub = c.sub
  CROSS JOIN session_info si
  WHERE sc.session_id = $1
    AND sc.user_answer IS NULL
  ORDER BY sc.id ASC
  LIMIT 1`;

export const GET_LAST_ANSWERED_CARD = `
  SELECT
    sc.card_sub AS "cardSub",
    sc.quality
  FROM games.session_card sc
  WHERE sc.session_id = $1
    AND sc.answered_at IS NOT NULL
  ORDER BY sc.answered_at DESC
  LIMIT 1;
`;
