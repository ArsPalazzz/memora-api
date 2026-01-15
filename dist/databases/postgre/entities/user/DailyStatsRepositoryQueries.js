"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_LAST_DAILY_STATS_BY_USER_ID = exports.EXIST_DAILY_STATS_BY_USER_ID = void 0;
exports.EXIST_DAILY_STATS_BY_USER_ID = `
  SELECT EXISTS (SELECT 1 FROM users.daily_stats WHERE user_id = $1);
`;
exports.GET_LAST_DAILY_STATS_BY_USER_ID = `
SELECT date, cards_reviewed, daily_goal, goal_achieved 
FROM users.daily_stats 
WHERE user_id = $1 
ORDER BY date DESC 
LIMIT 1;
`;
