export const INSERT_CARD = `
  INSERT INTO cards.card (desk_sub, front_variants, back_variants, sub) VALUES ($1, $2::jsonb, $3::jsonb, $4) RETURNING *;
`;

export const EXIST_CARD = `
  SELECT EXISTS (SELECT 1 FROM cards.card WHERE id = $1);
`;

export const EXIST_CARD_BY_SUB = `
  SELECT EXISTS (SELECT 1 FROM cards.card WHERE sub = $1);
`;

export const EXIST_DESK = `
  SELECT EXISTS (SELECT 1 FROM cards.desk WHERE sub = $1);
`;

export const UPDATE_LAST_TIME_PLAYED_DESK = `
    UPDATE cards.desk
    SET last_time_played = NOW()
    WHERE sub = $1
`;

export const HAVE_ACCESS_TO_DESK = `
  SELECT EXISTS (SELECT 1 FROM cards.desk WHERE sub = $1 AND creator_sub = $2);
`;

export const HAVE_ACCESS_TO_CARD = `
  SELECT EXISTS (
    SELECT 1
    FROM cards.card c
    JOIN cards.desk d ON d.sub = c.desk_sub
    WHERE c.sub = $1
      AND d.creator_sub = $2
  );
`;

export const UPDATE_DESK_SETTINGS = `
  UPDATE cards.desk_settings SET cards_per_session = $2, card_orientation = $3 WHERE desk_sub = $1;
`;

export const UPDATE_DESK = `
  UPDATE cards.desk SET title = $2, description = $3 WHERE sub = $1;
`;

export const UPDATE_CARD = `
  UPDATE cards.card SET front_variants = $2::jsonb, back_variants = $3::jsonb WHERE sub = $1;
`;

export const ARCHIVE_DESK = `
  UPDATE cards.desk SET status = 'archived' WHERE sub = $1;
`;

export const DELETE_CARD = `
  DELETE FROM cards.card WHERE sub = $1;
`;

export const INSERT_DESK = `
  INSERT INTO cards.desk (sub, title, description, creator_sub) VALUES ($1, $2, $3, $4) RETURNING created_at;
`;

export const INSERT_DESK_SETTINGS = `
  INSERT INTO cards.desk_settings (desk_sub) VALUES ($1);
`;

export const GET_CARDS = `
  SELECT * FROM cards.card ORDER BY created_at DESC;
`;

export const GET_CARD_SUBS_FOR_PLAY = `
    SELECT sub
    FROM cards.card
    WHERE desk_sub = $1
    ORDER BY random()
    LIMIT $2
`;

export const GET_DESKS_BY_CREATOR_SUB = `
  SELECT sub, title, description, created_at FROM cards.desk WHERE creator_sub = $1 ORDER BY created_at DESC;
`;

export const GET_DESK_DETAILS = `
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
      ucs.interval_days,
      ucs.ease_factor,
      ucs.next_review,
      ucs.last_review
    FROM cards.card c
    LEFT JOIN cards.user_card_srs ucs ON ucs.card_sub = c.sub AND ucs.user_sub = $2
    WHERE c.desk_sub = $1
  ),
  stats_calculation AS (
    SELECT 
      COUNT(*) as total_cards,
      COUNT(CASE WHEN repetitions = 0 OR repetitions IS NULL THEN 1 END) as new_cards,
      COUNT(CASE WHEN next_review <= NOW() THEN 1 END) as due_today,
      COUNT(CASE WHEN interval_days > 30 THEN 1 END) as mastered_cards,
      AVG(COALESCE(ease_factor, 2.5)) as avg_ease_factor
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
          'created_at', dc.created_at
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
