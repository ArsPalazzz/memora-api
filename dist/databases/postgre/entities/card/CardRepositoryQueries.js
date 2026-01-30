"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_DESK_CARDS = exports.GET_DESK_DETAILS = exports.GET_DESK_SUBS_BY_CREATOR_SUB = exports.GET_ARCHIVED_DESKS_BY_CREATOR_SUB = exports.GET_DESKS_BY_CREATOR_SUB = exports.GET_CARD_SUBS_FOR_PLAY = exports.GET_CARDS = exports.INSERT_DESK_SETTINGS = exports.GET_FOLDERS_BY_CREATOR_SUB = exports.HAVE_ACCESS_TO_FOLDER = exports.EXIST_FOLDER_BY_SUB = exports.INSERT_FOLDER = exports.INSERT_DESK = exports.DELETE_CARD = exports.RESTORE_DESK = exports.ARCHIVE_DESK = exports.GET_CARD = exports.UPDATE_CARD = exports.UPDATE_FEED_CARD_ORIENTATION = exports.UPDATE_DESK = exports.UPDATE_DESK_SETTINGS = exports.HAVE_ACCESS_TO_CARD = exports.HAVE_ACCESS_TO_DESK = exports.UPDATE_LAST_TIME_PLAYED_DESK = exports.EXIST_DESK = exports.EXIST_CARD_BY_SUB = exports.EXIST_CARD = exports.INSERT_CARD = void 0;
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
exports.UPDATE_FEED_CARD_ORIENTATION = `
  UPDATE cards.feed_settings SET card_orientation = $1 WHERE user_sub = $2;
`;
exports.UPDATE_CARD = `
  UPDATE cards.card SET front_variants = $2::jsonb, back_variants = $3::jsonb WHERE sub = $1;
`;
exports.GET_CARD = `
 SELECT 
    c.sub,
    c.created_at,
    c.front_variants AS "front_variants",
    c.back_variants AS "back_variants",
    COALESCE(
        array_agg(ce.sentence ORDER BY ce.created_at) FILTER (WHERE ce.id IS NOT NULL),
        ARRAY[]::text[]
    ) AS examples
FROM cards.card c
LEFT JOIN cards.card_examples ce ON ce.card_sub = c.sub
WHERE c.sub = $1
GROUP BY 
    c.sub, 
    c.created_at, 
    c.front_variants, 
    c.back_variants;
`;
exports.ARCHIVE_DESK = `
  UPDATE cards.desk SET status = 'archived' WHERE sub = $1;
`;
exports.RESTORE_DESK = `
  UPDATE cards.desk SET status = 'active' WHERE sub = $1;
`;
exports.DELETE_CARD = `
  DELETE FROM cards.card WHERE sub = $1;
`;
exports.INSERT_DESK = `
  INSERT INTO cards.desk (sub, title, description, public, creator_sub) VALUES ($1, $2, $3, $4, $5) RETURNING created_at;
`;
exports.INSERT_FOLDER = `
  INSERT INTO cards.folder (sub, title, description, creator_sub, parent_folder_sub) VALUES ($1, $2, $3, $4, $5) RETURNING created_at;
`;
exports.EXIST_FOLDER_BY_SUB = `
  SELECT EXISTS (SELECT 1 FROM cards.folder WHERE sub = $1);
`;
exports.HAVE_ACCESS_TO_FOLDER = `
  SELECT EXISTS (SELECT 1 FROM cards.folder WHERE sub = $1 AND creator_sub = $2);
`;
exports.GET_FOLDERS_BY_CREATOR_SUB = `
  SELECT 
    f.sub,
    f.title,
    f.description,
    f.parent_folder_sub AS "parentFolderSub",
    f.created_at AS "createdAt",
    COUNT(DISTINCT fd.desk_sub) AS "deskCount",
    COUNT(DISTINCT fc.sub) AS "childCount"
  FROM cards.folder f
  LEFT JOIN cards.folder_desk fd ON fd.folder_sub = f.sub
  LEFT JOIN cards.folder fc ON fc.parent_folder_sub = f.sub
  WHERE f.creator_sub = $1
  GROUP BY 
    f.sub,
    f.title,
    f.description,
    f.parent_folder_sub,
    f.created_at
  ORDER BY f.created_at ASC;
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
  SELECT
  d.sub,
  d.title,
  d.description,
  d.status,

  COUNT(DISTINCT c.sub) AS "totalCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions IS NULL OR ucs.repetitions = 0
      THEN c.sub
    END
  ) AS "newCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.next_review <= NOW()
      THEN c.sub
    END
  ) AS "dueCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions > 0
           AND (ucs.next_review > NOW() OR ucs.next_review IS NULL)
           AND ucs.interval_minutes <= 43200
      THEN c.sub
    END
  ) AS "learningCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.interval_minutes > 43200
      THEN c.sub
    END
  ) AS "masteredCards" -- FIX

FROM cards.desk d
LEFT JOIN cards.card c
  ON c.desk_sub = d.sub
LEFT JOIN cards.user_card_srs ucs
  ON ucs.card_sub = c.sub
 AND ucs.user_sub = $1

WHERE d.creator_sub = $1

GROUP BY
  d.sub,
  d.title,
  d.status,
  d.description,
  d.created_at

ORDER BY d.created_at DESC;
`;
exports.GET_ARCHIVED_DESKS_BY_CREATOR_SUB = `
  SELECT
  d.sub,
  d.title,
  d.description,
  d.status,

  COUNT(DISTINCT c.sub) AS "totalCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions IS NULL OR ucs.repetitions = 0
      THEN c.sub
    END
  ) AS "newCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.next_review <= NOW()
      THEN c.sub
    END
  ) AS "dueCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions > 0
           AND (ucs.next_review > NOW() OR ucs.next_review IS NULL)
           AND ucs.interval_minutes <= 43200
      THEN c.sub
    END
  ) AS "learningCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.interval_minutes > 43200
      THEN c.sub
    END
  ) AS "masteredCards" -- FIX

FROM cards.desk d
LEFT JOIN cards.card c
  ON c.desk_sub = d.sub
LEFT JOIN cards.user_card_srs ucs
  ON ucs.card_sub = c.sub
 AND ucs.user_sub = $1

WHERE d.creator_sub = $1 AND d.status = 'archived'

GROUP BY
  d.sub,
  d.title,
  d.status,
  d.description,
  d.created_at

ORDER BY d.created_at DESC;
`;
exports.GET_DESK_SUBS_BY_CREATOR_SUB = `
  SELECT sub, title FROM cards.desk WHERE creator_sub = $1 ORDER BY created_at DESC;
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
  ),
  desk_cards AS (
    SELECT 
      c.sub,
      c.front_variants,
      c.back_variants,
      c.created_at,
      ucs.repetitions,
      ucs.interval_minutes,
      ucs.ease_factor,
      ucs.next_review,
      ucs.last_review,
      COALESCE(
        json_agg(ce.sentence ORDER BY ce.created_at) FILTER (WHERE ce.sentence IS NOT NULL),
        '[]'::json
      ) as examples
    FROM cards.card c
    LEFT JOIN cards.user_card_srs ucs ON ucs.card_sub = c.sub AND ucs.user_sub = $2
    LEFT JOIN cards.card_examples ce ON ce.card_sub = c.sub
    WHERE c.desk_sub = $1
    GROUP BY 
      c.sub, c.front_variants, c.back_variants, c.created_at,
      ucs.repetitions, ucs.interval_minutes, ucs.ease_factor, 
      ucs.next_review, ucs.last_review
  ),
  stats_calculation AS (
    SELECT 
      COUNT(*) as total_cards,
      COUNT(CASE WHEN repetitions = 0 OR repetitions IS NULL THEN 1 END) as new_cards,
      COUNT(CASE WHEN next_review <= NOW() THEN 1 END) as due_today,
      COUNT(CASE WHEN interval_minutes > 43200 THEN 1 END) as mastered_cards,
      COALESCE(AVG(COALESCE(ease_factor, 2.5)), 0) as avg_ease_factor
    FROM desk_cards
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
          'sub', dc.sub,
          'front_variants', dc.front_variants,
          'back_variants', dc.back_variants,
          'created_at', dc.created_at,
          'examples', dc.examples
        )
        ORDER BY dc.created_at DESC
      ) FILTER (WHERE dc.sub IS NOT NULL), '[]'
    ) AS cards,
    json_build_object(
      'total_cards', sc.total_cards,
      'new_cards', sc.new_cards,
      'due_today', sc.due_today,
      'mastered_cards', sc.mastered_cards,
      'avg_ease_factor', sc.avg_ease_factor
    ) AS stats
  FROM desk_data dd
  LEFT JOIN desk_cards dc ON true
  LEFT JOIN stats_calculation sc ON true
  GROUP BY 
    dd.sub, dd.title, dd.description, dd.created_at, 
    dd.cards_per_session, dd.card_orientation,
    sc.total_cards, sc.new_cards, sc.due_today, sc.mastered_cards, sc.avg_ease_factor;
`;
exports.GET_DESK_CARDS = `
SELECT 
    c.sub,
    c.created_at AS "createdAt",
    c.front_variants AS "frontVariants",
    c.back_variants AS "backVariants",
    COALESCE(
        array_agg(ce.sentence ORDER BY ce.created_at) FILTER (WHERE ce.id IS NOT NULL),
        ARRAY[]::text[]
    ) AS examples
FROM cards.card c
LEFT JOIN cards.card_examples ce ON ce.card_sub = c.sub
WHERE c.desk_sub = $1
GROUP BY 
    c.sub, 
    c.created_at, 
    c.front_variants, 
    c.back_variants
ORDER BY c.created_at DESC;
`;
