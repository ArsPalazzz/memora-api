export const GET_MATCH_BOARD_SLOTS = `
  SELECT
    slot_id AS "slotId",
    card_sub AS "cardSub",
    slot_text AS "slotText"
  FROM games.match_board_slot
  WHERE session_id = $1
  ORDER BY slot_id ASC;
`;

export const INSERT_MATCH_BOARD_SLOT = `
  INSERT INTO games.match_board_slot (session_id, slot_id, card_sub, slot_text)
  VALUES ($1, $2, $3, $4);
`;

export const GET_SESSION_CARDS_FOR_MATCH = `
  SELECT
    sc.id AS "sessionCardId",
    sc.card_sub AS "cardSub",
    sc.direction,
    sc.answered_at AS "answeredAt",
    sc.is_correct AS "isCorrect",
    c.front_variants AS "frontVariants",
    c.back_variants AS "backVariants"
  FROM games.session_card sc
  JOIN games.session s ON s.id = sc.session_id
  JOIN cards.card c ON c.sub = sc.card_sub
  WHERE sc.session_id = $1
    AND s.user_sub = $2
  ORDER BY sc.id ASC;
`;

export const HAS_MATCH_SUBMIT = `
  SELECT EXISTS (
    SELECT 1
    FROM games.session_card
    WHERE session_id = $1
      AND answered_at IS NOT NULL
    LIMIT 1
  );
`;

export const SAVE_MATCH_RESULTS = `
  UPDATE games.session_card sc
  SET
    user_answer = v.slot_id::text,
    is_correct = v.is_correct,
    answered_at = NOW()
  FROM (
    SELECT
      unnest($2::uuid[]) AS card_sub,
      unnest($3::boolean[]) AS is_correct,
      unnest($4::int[]) AS slot_id
  ) v
  WHERE sc.session_id = $1
    AND sc.card_sub = v.card_sub
    AND sc.answered_at IS NULL;
`;

export const GET_MATCH_CARD_FOR_GRADE = `
  SELECT sc.card_sub AS "cardSub"
  FROM games.session_card sc
  WHERE sc.session_id = $1
    AND sc.card_sub = $2
    AND sc.answered_at IS NOT NULL
    AND sc.quality IS NULL
  LIMIT 1;
`;

export const SET_MATCH_CARD_QUALITY = `
  UPDATE games.session_card
  SET quality = $3
  WHERE session_id = $1
    AND card_sub = $2
    AND answered_at IS NOT NULL
    AND quality IS NULL;
`;

export const HAS_UNGRADED_MATCH_CARDS = `
  SELECT EXISTS (
    SELECT 1
    FROM games.session_card
    WHERE session_id = $1
      AND answered_at IS NOT NULL
      AND quality IS NULL
    LIMIT 1
  );
`;
