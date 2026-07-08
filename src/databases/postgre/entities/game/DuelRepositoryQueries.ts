export const INSERT_DUEL = `
  INSERT INTO games.duel (
    id, code, host_sub, desk_sub, config, status
  )
  VALUES ($1, $2, $3, $4, $5::jsonb, 'waiting')
  RETURNING *;
`;

export const INSERT_DUEL_PLAYER = `
  INSERT INTO games.duel_player (duel_id, user_sub, slot, ready)
  VALUES ($1, $2, $3, $4)
  RETURNING *;
`;

export const GET_DUEL_BY_ID = `
  SELECT
    d.*,
    desk.title AS desk_title
  FROM games.duel d
  INNER JOIN cards.desk desk ON desk.sub = d.desk_sub
  WHERE d.id = $1;
`;

export const GET_DUEL_BY_CODE = `
  SELECT
    d.*,
    desk.title AS desk_title
  FROM games.duel d
  INNER JOIN cards.desk desk ON desk.sub = d.desk_sub
  WHERE d.code = $1;
`;

export const GET_DUEL_PLAYERS = `
  SELECT
    dp.*,
    p.nickname,
    p.avatar_key
  FROM games.duel_player dp
  INNER JOIN users.profile p ON p.sub = dp.user_sub
  WHERE dp.duel_id = $1
  ORDER BY dp.slot ASC;
`;

export const COUNT_DUEL_PLAYERS = `
  SELECT COUNT(*)::int AS count
  FROM games.duel_player
  WHERE duel_id = $1;
`;

export const UPDATE_DUEL_STATUS = `
  UPDATE games.duel
  SET status = $2::games.duel_status_enum
  WHERE id = $1;
`;

export const UPDATE_DUEL_CONFIG = `
  UPDATE games.duel
  SET config = $2::jsonb
  WHERE id = $1;
`;

export const UPDATE_DUEL_CARDS = `
  UPDATE games.duel
  SET card_seed = $2, card_subs = $3::uuid[]
  WHERE id = $1;
`;

export const UPDATE_DUEL_PLAYER_READY = `
  UPDATE games.duel_player
  SET ready = $3
  WHERE duel_id = $1 AND user_sub = $2;
`;

export const DELETE_DUEL_PLAYER = `
  DELETE FROM games.duel_player
  WHERE duel_id = $1 AND user_sub = $2;
`;

export const EXISTS_DUEL_CODE = `
  SELECT EXISTS (
    SELECT 1 FROM games.duel WHERE code = $1
  ) AS exists;
`;

export const GET_DUEL_PLAYER = `
  SELECT *
  FROM games.duel_player
  WHERE duel_id = $1 AND user_sub = $2;
`;

export const IS_DUEL_PARTICIPANT = `
  SELECT EXISTS (
    SELECT 1 FROM games.duel_player
    WHERE duel_id = $1 AND user_sub = $2
  ) AS exists;
`;

export const COUNT_CARDS_BY_DESK = `
  SELECT COUNT(*)::int AS count
  FROM cards.card
  WHERE desk_sub = $1;
`;

export const GET_CARD_SUBS_BY_DESK_FOR_DUEL = `
  SELECT sub
  FROM cards.card
  WHERE desk_sub = $1
  ORDER BY created_at DESC;
`;

export const CANCEL_DUEL = `
  UPDATE games.duel
  SET status = 'cancelled', finished_at = NOW()
  WHERE id = $1 AND status IN ('waiting', 'countdown');
`;

export const CANCEL_DUELS_BY_DESK = `
  UPDATE games.duel
  SET status = 'cancelled', finished_at = NOW()
  WHERE desk_sub = $1 AND status IN ('waiting', 'countdown');
`;

export const IS_DESK_ACTIVE = `
  SELECT EXISTS (
    SELECT 1 FROM cards.desk
    WHERE sub = $1 AND status = 'active'::cards.desk_status_enum
  ) AS exists;
`;

export const CANCEL_PENDING_DUELS_BETWEEN_PAIR = `
  UPDATE games.duel d
  SET status = 'cancelled', finished_at = NOW()
  WHERE d.status = 'waiting'
    AND (
      d.id IN (
        SELECT dp1.duel_id
        FROM games.duel_player dp1
        INNER JOIN games.duel_player dp2
          ON dp2.duel_id = dp1.duel_id
         AND dp2.user_sub = $2
        WHERE dp1.user_sub = $1
      )
      OR (
        d.host_sub = $1
        AND (
          SELECT COUNT(*)::int
          FROM games.duel_player dp
          WHERE dp.duel_id = d.id
        ) = 1
      )
    );
`;

export const MARK_PLAYER_DISCONNECTED = `
  UPDATE games.duel_player
  SET disconnected_at = NOW()
  WHERE duel_id = $1 AND user_sub = $2 AND disconnected_at IS NULL;
`;

export const CLEAR_PLAYER_DISCONNECTED = `
  UPDATE games.duel_player
  SET disconnected_at = NULL
  WHERE duel_id = $1 AND user_sub = $2;
`;

export const BEGIN_DUEL_COUNTDOWN = `
  UPDATE games.duel
  SET status = 'countdown'::games.duel_status_enum,
      started_at = NOW()
  WHERE id = $1 AND status = 'waiting'::games.duel_status_enum;
`;

export const SET_DUEL_STARTED = `
  UPDATE games.duel
  SET status = 'racing'::games.duel_status_enum,
      started_at = NOW()
  WHERE id = $1 AND status = 'countdown'::games.duel_status_enum;
`;

export const GET_DUEL_CARDS_BY_SUBS = `
  SELECT
    c.sub,
    c.front_variants AS front_variants,
    c.back_variants AS back_variants,
    c.image_key
  FROM cards.card c
  WHERE c.sub = ANY($1::uuid[])
  ORDER BY array_position($1::uuid[], c.sub);
`;

export const UPDATE_DUEL_PLAYER_RACE_STATE = `
  UPDATE games.duel_player
  SET
    score = $3,
    correct_count = $4,
    wrong_count = $5,
    total_time_ms = $6,
    max_streak = $7,
    answers = $8::jsonb
  WHERE duel_id = $1 AND user_sub = $2;
`;

export const UPDATE_DUEL_PLAYER_PLACEMENT = `
  UPDATE games.duel_player
  SET placement = $3
  WHERE duel_id = $1 AND user_sub = $2;
`;

export const FINISH_DUEL = `
  UPDATE games.duel
  SET status = 'finished'::games.duel_status_enum,
      finished_at = NOW()
  WHERE id = $1 AND status = 'racing'::games.duel_status_enum;
`;

export const GET_HEAD_TO_HEAD_OUTCOMES = `
  SELECT
    dp.placement
  FROM games.duel_player dp
  INNER JOIN games.duel d ON d.id = dp.duel_id
  WHERE d.status = 'finished'
    AND dp.user_sub = $1
    AND dp.placement IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM games.duel_player opp
      WHERE opp.duel_id = dp.duel_id
        AND opp.user_sub = $2
    );
`;

export const GET_DUEL_HISTORY_FOR_USER = `
  SELECT
    d.id,
    d.desk_sub,
    d.config,
    d.finished_at,
    desk.title AS desk_title,
    me.placement AS my_placement,
    me.score AS my_score,
    me.answers AS my_answers,
    opp.user_sub AS opponent_sub,
    opp.placement AS opponent_placement,
    opp.score AS opponent_score,
    opp.answers AS opponent_answers,
    p.nickname AS opponent_nickname,
    p.avatar_key AS opponent_avatar_key
  FROM games.duel d
  INNER JOIN games.duel_player me ON me.duel_id = d.id AND me.user_sub = $1
  INNER JOIN cards.desk desk ON desk.sub = d.desk_sub
  LEFT JOIN games.duel_player opp ON opp.duel_id = d.id AND opp.user_sub <> $1
  LEFT JOIN users.profile p ON p.sub = opp.user_sub
  WHERE d.status = 'finished'::games.duel_status_enum
  ORDER BY d.finished_at DESC NULLS LAST
  LIMIT $2;
`;
