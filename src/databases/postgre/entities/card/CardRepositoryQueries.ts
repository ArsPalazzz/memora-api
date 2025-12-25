export const INSERT_CARD = `
  INSERT INTO cards.card (desk_sub, front_side, back_side, sub) VALUES ($1, $2, $3, $4) RETURNING *;
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
  UPDATE cards.card SET front_side = $2, back_side = $3 WHERE sub = $1;
`;

export const ARCHIVE_DESK = `
  UPDATE cards.desk SET status = 'archived' WHERE sub = $1;
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

export const GET_CARDS_FOR_PLAY = `
    SELECT id, front_side, back_side
    FROM cards.card
    WHERE desk_sub = $1
    ORDER BY random()
    LIMIT $2
`;

export const GET_DESKS = `
  SELECT sub, title, description, created_at FROM cards.desk ORDER BY created_at DESC;
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
          'front_side', c.front_side,
          'back_side', c.back_side,
          'created_at', c.created_at
        )
        ORDER BY c.created_at DESC
      ) FILTER (WHERE c.sub IS NOT NULL), '[]'
    ) AS cards
  FROM desk_data dd
  LEFT JOIN cards.card c ON c.desk_sub = dd.sub
  GROUP BY dd.sub, dd.title, dd.description, dd.created_at, dd.cards_per_session, dd.card_orientation;
`;
