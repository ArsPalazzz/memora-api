export const GET_PINNED_FOLDERS = `
  SELECT
    f.sub AS folder_sub,
    f.title,
    pf.created_at
  FROM cards.pinned_folder pf
  INNER JOIN cards.folder f ON f.sub = pf.folder_sub
  WHERE pf.user_sub = $1
    AND f.creator_sub = $1
  ORDER BY pf.created_at ASC
`;

export const COUNT_PINNED_FOLDERS = `
  SELECT COUNT(*)::int AS count
  FROM cards.pinned_folder
  WHERE user_sub = $1
`;

export const EXIST_PINNED_FOLDER = `
  SELECT EXISTS (
    SELECT 1
    FROM cards.pinned_folder
    WHERE user_sub = $1
      AND folder_sub = $2
  )
`;

export const INSERT_PINNED_FOLDER = `
  INSERT INTO cards.pinned_folder (user_sub, folder_sub)
  VALUES ($1, $2)
  ON CONFLICT (user_sub, folder_sub) DO NOTHING
`;

export const DELETE_PINNED_FOLDER = `
  DELETE FROM cards.pinned_folder
  WHERE user_sub = $1
    AND folder_sub = $2
`;
