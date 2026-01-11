export const CREATE_GAME_SESSION = `
  INSERT INTO games.session(id, user_sub, type, mode, desk_sub, status, created_at)
    VALUES($1,$2,'desk','write',$3,'active',NOW())`;

export const CREATE_REVIEW_SESSION = `
  INSERT INTO games.session(id, user_sub, type, mode, batch_id, status, created_at)
    VALUES($1,$2,'review','write',$3,'active',NOW())`;

export const HAVE_ACCESS_TO_SESSION = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1 AND user_sub = $2);
`;

export const EXIST_BY_SESSION_ID = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1);
`;

export const IS_SESSION_ACTIVE = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1 AND status = 'active');
`;

export const FINISH_SESSION = `
  UPDATE games.session SET status = 'finished' WHERE id = $1;
`;

export const GET_NEXT_UNANSWERED_CARD = `
  SELECT
    sc.id            AS "sessionCardId",
    sc.card_sub AS "cardSub",
    sc.direction,
    c.front_variants AS "frontVariants",
    c.back_variants AS "backVariants"
  FROM games.session_card sc
  JOIN games.session s ON s.id = sc.session_id
  JOIN cards.card c ON c.sub = sc.card_sub
    WHERE sc.session_id = $1
      AND s.user_sub = $2
      AND sc.answered_at IS NULL
  ORDER BY sc.id
  LIMIT 1;
`;

export const SAVE_ANSWER = `
  UPDATE games.session_card
  SET
    user_answer = $1,
    is_correct = $2,
    answered_at = NOW()
  WHERE id = $3;
`;

export const HAS_UNANSWERED_CARDS = `
  SELECT EXISTS (
    SELECT 1
    FROM games.session_card
      WHERE session_id = $1
        AND answered_at IS NULL
    LIMIT 1
  );
`;
