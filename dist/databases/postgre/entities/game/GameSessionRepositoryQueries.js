"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HAS_UNANSWERED_CARDS = exports.SAVE_ANSWER = exports.GET_NEXT_UNANSWERED_CARD = exports.FINISH_SESSION = exports.IS_SESSION_ACTIVE = exports.EXIST_BY_SESSION_ID = exports.HAVE_ACCESS_TO_SESSION = exports.CREATE_GAME_SESSION = void 0;
exports.CREATE_GAME_SESSION = `
  INSERT INTO games.session(id, user_sub, type, mode, desk_sub, status, created_at)
    VALUES($1,$2,'desk','write',$3,'active',NOW())`;
exports.HAVE_ACCESS_TO_SESSION = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1 AND user_sub = $2);
`;
exports.EXIST_BY_SESSION_ID = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1);
`;
exports.IS_SESSION_ACTIVE = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1 AND status = 'active');
`;
exports.FINISH_SESSION = `
  UPDATE games.session SET status = 'finished' WHERE id = $1;
`;
exports.GET_NEXT_UNANSWERED_CARD = `
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
exports.SAVE_ANSWER = `
  UPDATE games.session_card
  SET
    user_answer = $1,
    is_correct = $2,
    answered_at = NOW()
  WHERE id = $3;
`;
exports.HAS_UNANSWERED_CARDS = `
  SELECT EXISTS (
    SELECT 1
    FROM games.session_card
      WHERE session_id = $1
        AND answered_at IS NULL
    LIMIT 1
  );
`;
