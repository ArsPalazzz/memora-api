"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_DESK_DETAILS = exports.GET_DESKS_BY_CREATOR_SUB = exports.GET_CARD_SUBS_FOR_PLAY = exports.GET_CARDS = exports.INSERT_DESK_SETTINGS = exports.INSERT_DESK = exports.ARCHIVE_DESK = exports.UPDATE_CARD = exports.UPDATE_DESK = exports.UPDATE_DESK_SETTINGS = exports.HAVE_ACCESS_TO_CARD = exports.HAVE_ACCESS_TO_DESK = exports.UPDATE_LAST_TIME_PLAYED_DESK = exports.EXIST_DESK = exports.EXIST_CARD_BY_SUB = exports.EXIST_CARD = exports.INSERT_CARD = void 0;
exports.INSERT_CARD = `
  INSERT INTO cards.card (desk_sub, front_variants, back_variants, sub) VALUES ($1, $2::jsonb, $3::jsonb, $4) RETURNING *;
`;
exports.EXIST_CARD = `
  SELECT EXISTS (SELECT 1 FROM cards.card WHERE id = $1);
`;
exports.EXIST_CARD_BY_SUB = `
  SELECT EXISTS (SELECT 1 FROM cards.card WHERE sub = $1);
`;
exports.EXIST_DESK = `
  SELECT EXISTS (SELECT 1 FROM cards.desk WHERE sub = $1);
`;
exports.UPDATE_LAST_TIME_PLAYED_DESK = `
    UPDATE cards.desk
    SET last_time_played = NOW()
    WHERE sub = $1
`;
exports.HAVE_ACCESS_TO_DESK = `
  SELECT EXISTS (SELECT 1 FROM cards.desk WHERE sub = $1 AND creator_sub = $2);
`;
exports.HAVE_ACCESS_TO_CARD = `
  SELECT EXISTS (
    SELECT 1
    FROM cards.card c
    JOIN cards.desk d ON d.sub = c.desk_sub
    WHERE c.sub = $1
      AND d.creator_sub = $2
  );
`;
exports.UPDATE_DESK_SETTINGS = `
  UPDATE cards.desk_settings SET cards_per_session = $2, card_orientation = $3 WHERE desk_sub = $1;
`;
exports.UPDATE_DESK = `
  UPDATE cards.desk SET title = $2, description = $3 WHERE sub = $1;
`;
exports.UPDATE_CARD = `
  UPDATE cards.card SET front_variants = $2::jsonb, back_variants = $3::jsonb WHERE sub = $1;
`;
exports.ARCHIVE_DESK = `
  UPDATE cards.desk SET status = 'archived' WHERE sub = $1;
`;
exports.INSERT_DESK = `
  INSERT INTO cards.desk (sub, title, description, creator_sub) VALUES ($1, $2, $3, $4) RETURNING created_at;
`;
exports.INSERT_DESK_SETTINGS = `
  INSERT INTO cards.desk_settings (desk_sub) VALUES ($1);
`;
exports.GET_CARDS = `
  SELECT * FROM cards.card ORDER BY created_at DESC;
`;
exports.GET_CARD_SUBS_FOR_PLAY = `
    SELECT sub
    FROM cards.card
    WHERE desk_sub = $1
    ORDER BY random()
    LIMIT $2
`;
exports.GET_DESKS_BY_CREATOR_SUB = `
  SELECT sub, title, description, created_at FROM cards.desk WHERE creator_sub = $1 ORDER BY created_at DESC;
`;
exports.GET_DESK_DETAILS = `
  WITH desk_data AS (
    SELECT 
      d.sub,
      d.title,
      d.description,
      d.created_at,
      ds.cards_per_session,
      ds.card_orientation
    FROM cards.desk d
    LEFT JOIN cards.desk_settings ds ON ds.desk_sub = d.sub
    WHERE d.sub = $1
  )
  SELECT 
    dd.sub,
    dd.title,
    dd.description,
    dd.created_at,
    json_build_object(
      'cards_per_session', dd.cards_per_session,
      'card_orientation', dd.card_orientation
    ) AS settings,
    COALESCE(
      json_agg(
        json_build_object(
          'sub', c.sub,
          'front_variants', c.front_variants,
          'back_variants', c.back_variants,
          'created_at', c.created_at
        )
        ORDER BY c.created_at DESC
      ) FILTER (WHERE c.sub IS NOT NULL), '[]'
    ) AS cards
  FROM desk_data dd
  LEFT JOIN cards.card c ON c.desk_sub = dd.sub
  GROUP BY dd.sub, dd.title, dd.description, dd.created_at, dd.cards_per_session, dd.card_orientation;
`;
