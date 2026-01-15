export const INSERT_STREAK_STATS = `
  INSERT INTO users.streak_stats (user_id) VALUES ($1) RETURNING *;
`;

export const GET_STREAK_STATS_BY_USER_ID = `
  SELECT current_streak, longest_streak 
FROM users.streak_stats 
WHERE user_id = $1;
`;
