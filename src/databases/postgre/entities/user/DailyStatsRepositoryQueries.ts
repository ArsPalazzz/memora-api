export const EXIST_DAILY_STATS_BY_USER_ID = `
  SELECT EXISTS (SELECT 1 FROM users.daily_stats WHERE user_id = $1);
`;

export const GET_LAST_DAILY_STATS_BY_USER_ID = `
SELECT date, cards_reviewed, daily_goal, goal_achieved 
FROM users.daily_stats 
WHERE user_id = $1 
ORDER BY date DESC 
LIMIT 1;
`;

export const GET_CARDS_REVIEWED_THIS_WEEK = `
  SELECT COALESCE(SUM(cards_reviewed), 0)::int AS cards_reviewed
  FROM users.daily_stats
  WHERE user_id = $1
    AND date >= date_trunc('week', CURRENT_DATE)::date
`;
