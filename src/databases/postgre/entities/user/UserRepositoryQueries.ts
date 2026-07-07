export const INSERT_USER = `
  INSERT INTO users.profile (sub, nickname, email, role, pass_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *;
`;

export const EXISTS_BY_NICKNAME = `
  SELECT EXISTS (
    SELECT 1
    FROM users.profile
    WHERE lower(nickname) = lower($1)
    LIMIT 1
  );
`;

export const GET_PUBLIC_PROFILE_BY_NICKNAME = `
  SELECT sub, nickname, created_at, stats_public
  FROM users.profile
  WHERE lower(nickname) = lower($1)
  LIMIT 1
`;

export const UPDATE_STATS_PUBLIC = `
  UPDATE users.profile
  SET stats_public = $2
  WHERE sub = $1
`;

export const UPDATE_LEAGUE_NOTIFICATIONS = `
  UPDATE users.profile
  SET league_notifications = $2
  WHERE sub = $1
`;

export const GET_LEAGUE_NOTIFICATION_STATE = `
  SELECT
    league_notifications,
    league_last_rank,
    league_last_week_start::text AS league_last_week_start,
    league_last_notified_date::text AS league_last_notified_date
  FROM users.profile
  WHERE sub = $1
  LIMIT 1
`;

export const UPDATE_LEAGUE_NOTIFICATION_STATE = `
  UPDATE users.profile
  SET
    league_last_rank = $2,
    league_last_week_start = $3::date,
    league_last_notified_date = COALESCE($4::date, league_last_notified_date)
  WHERE sub = $1
`;

export const MARK_LEAGUE_NOTIFIED_TODAY = `
  UPDATE users.profile
  SET league_last_notified_date = $2::date
  WHERE sub = $1
`;

export const GET_USERS_FOR_LEAGUE_NOTIFICATIONS = `
  SELECT p.sub
  FROM users.profile p
  WHERE p.league_notifications = true
    AND EXISTS (
      SELECT 1
      FROM notifications.fcm_token t
      WHERE t.user_sub = p.sub
        AND t.is_active = true
        AND t.created_at > NOW() - interval '90 days'
    )
`;
