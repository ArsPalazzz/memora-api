export const EXISTS_LIBRARY_ENTRY_BY_USER_AND_SOURCE = `
  SELECT EXISTS (
    SELECT 1
    FROM cards.desk_library_entry
    WHERE user_sub = $1
      AND source_desk_sub = $2
  );
`;

export const INSERT_LIBRARY_ENTRY = `
  INSERT INTO cards.desk_library_entry (
    sub,
    user_sub,
    source_desk_sub,
    local_desk_sub,
    source_creator_sub,
    mode
  )
  VALUES ($1, $2, $3, $4, $5, $6);
`;

export const GET_LIBRARY_SOURCES_BY_USER = `
  SELECT
    dle.sub,
    dle.source_desk_sub,
    dle.local_desk_sub,
    dle.source_creator_sub,
    dle.mode,
    dle.created_at,
    sd.title AS source_desk_title,
    ld.title AS local_desk_title,
    p.nickname AS source_creator_nickname
  FROM cards.desk_library_entry dle
  INNER JOIN cards.desk sd ON sd.sub = dle.source_desk_sub
  INNER JOIN cards.desk ld ON ld.sub = dle.local_desk_sub
  INNER JOIN users.profile p ON p.sub = dle.source_creator_sub
  WHERE dle.user_sub = $1
  ORDER BY dle.created_at DESC
`;
