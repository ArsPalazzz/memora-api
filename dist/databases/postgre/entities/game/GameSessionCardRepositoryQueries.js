"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_LAST_ANSWERED_CARD = exports.GET_NEXT_IN_SESSION_CARD = exports.CREATE_GAME_SESSION_CARD = void 0;
exports.CREATE_GAME_SESSION_CARD = `
  INSERT INTO games.session_card(session_id, card_sub, direction, created_at)
    VALUES($1,$2,$3,NOW())`;
exports.GET_NEXT_IN_SESSION_CARD = `
  SELECT
    sc.card_sub AS sub,
    sc.direction,
    CASE
      WHEN sc.direction = 'front_to_back' THEN c.front_variants
      WHEN sc.direction = 'back_to_front' THEN c.back_variants
    END AS "text"
  FROM games.session_card sc
  JOIN cards.card c ON sc.card_sub = c.sub
  WHERE sc.session_id = $1
    AND sc.user_answer IS NULL
  ORDER BY sc.id ASC
  LIMIT 1`;
exports.GET_LAST_ANSWERED_CARD = `
  SELECT
    sc.card_sub AS "cardSub",
    sc.quality
  FROM games.session_card sc
  WHERE sc.session_id = $1
    AND sc.answered_at IS NOT NULL
  ORDER BY sc.answered_at DESC
  LIMIT 1;
`;
