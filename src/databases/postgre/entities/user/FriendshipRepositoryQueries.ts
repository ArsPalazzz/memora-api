export const INSERT_FRIENDSHIP = `
  INSERT INTO users.friendship (requester_sub, addressee_sub, status)
  VALUES ($1, $2, 'pending');
`;

export const GET_FRIENDSHIP_BETWEEN = `
  SELECT requester_sub, addressee_sub, status, created_at
  FROM users.friendship
  WHERE (requester_sub = $1 AND addressee_sub = $2)
     OR (requester_sub = $2 AND addressee_sub = $1)
  LIMIT 1;
`;

export const ACCEPT_FRIENDSHIP = `
  UPDATE users.friendship
  SET status = 'accepted'
  WHERE requester_sub = $1
    AND addressee_sub = $2
    AND status = 'pending'
  RETURNING requester_sub;
`;

export const DELETE_FRIENDSHIP = `
  DELETE FROM users.friendship
  WHERE (requester_sub = $1 AND addressee_sub = $2)
     OR (requester_sub = $2 AND addressee_sub = $1);
`;

export const DELETE_PENDING_FRIENDSHIP = `
  DELETE FROM users.friendship
  WHERE requester_sub = $1
    AND addressee_sub = $2
    AND status = 'pending';
`;

export const GET_INCOMING_FRIEND_REQUESTS = `
  SELECT p_requester.sub, p_requester.nickname
  FROM users.friendship f
  INNER JOIN users.profile p_requester ON p_requester.sub = f.requester_sub
  WHERE f.addressee_sub = $1
    AND f.status = 'pending'
  ORDER BY f.created_at DESC;
`;

export const GET_ACCEPTED_FRIENDS = `
  SELECT
    CASE
      WHEN f.requester_sub = $1 THEN p_addressee.sub
      ELSE p_requester.sub
    END AS sub,
    CASE
      WHEN f.requester_sub = $1 THEN p_addressee.nickname
      ELSE p_requester.nickname
    END AS nickname
  FROM users.friendship f
  INNER JOIN users.profile p_requester ON p_requester.sub = f.requester_sub
  INNER JOIN users.profile p_addressee ON p_addressee.sub = f.addressee_sub
  WHERE f.status = 'accepted'
    AND ($1 = f.requester_sub OR $1 = f.addressee_sub)
  ORDER BY nickname;
`;

export const ARE_ACCEPTED_FRIENDS = `
  SELECT EXISTS (
    SELECT 1
    FROM users.friendship f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_sub = $1 AND f.addressee_sub = $2)
        OR (f.requester_sub = $2 AND f.addressee_sub = $1)
      )
  ) AS are_friends;
`;

export const GET_FRIENDS_ACTIVITY = `
  SELECT
    CASE
      WHEN f.requester_sub = $1 THEN p_addressee.nickname
      ELSE p_requester.nickname
    END AS nickname,
    COALESCE(ds.cards_reviewed, 0)::int AS cards_reviewed,
    COALESCE(
      ds.daily_goal,
      LEAST(200, 20 + GREATEST(COALESCE(ss.current_streak, 1) - 1, 0) * 5)
    )::int AS daily_goal,
    COALESCE(ds.goal_achieved, false) AS goal_achieved,
    COALESCE(ss.current_streak, 1)::int AS current_streak
  FROM users.friendship f
  INNER JOIN users.profile p_requester ON p_requester.sub = f.requester_sub
  INNER JOIN users.profile p_addressee ON p_addressee.sub = f.addressee_sub
  LEFT JOIN users.streak_stats ss ON ss.user_id = (
    CASE WHEN f.requester_sub = $1 THEN p_addressee.id ELSE p_requester.id END
  )
  LEFT JOIN users.daily_stats ds ON ds.user_id = (
    CASE WHEN f.requester_sub = $1 THEN p_addressee.id ELSE p_requester.id END
  ) AND ds.date = CURRENT_DATE
  WHERE f.status = 'accepted'
    AND ($1 = f.requester_sub OR $1 = f.addressee_sub)
    AND (
      (f.requester_sub = $1 AND p_addressee.stats_public = true)
      OR (f.addressee_sub = $1 AND p_requester.stats_public = true)
    )
    AND COALESCE(ds.cards_reviewed, 0) > 0
  ORDER BY
    COALESCE(ds.goal_achieved, false) DESC,
    COALESCE(ds.cards_reviewed, 0) DESC,
    nickname ASC
  LIMIT 10;
`;

export const GET_WEEKLY_LEAGUE = `
  WITH week_bounds AS (
    SELECT
      date_trunc('week', timezone('UTC', now()))::date AS week_start,
      (date_trunc('week', timezone('UTC', now()))::date + interval '6 days')::date AS week_end
  ),
  participants AS (
    SELECT p.id AS user_id, p.nickname, true AS is_me
    FROM users.profile p
    WHERE p.sub = $1

    UNION ALL

    SELECT
      CASE WHEN f.requester_sub = $1 THEN p_addressee.id ELSE p_requester.id END,
      CASE WHEN f.requester_sub = $1 THEN p_addressee.nickname ELSE p_requester.nickname END,
      false
    FROM users.friendship f
    INNER JOIN users.profile p_requester ON p_requester.sub = f.requester_sub
    INNER JOIN users.profile p_addressee ON p_addressee.sub = f.addressee_sub
    WHERE f.status = 'accepted'
      AND ($1 = f.requester_sub OR $1 = f.addressee_sub)
      AND (
        (f.requester_sub = $1 AND p_addressee.stats_public = true)
        OR (f.addressee_sub = $1 AND p_requester.stats_public = true)
      )
  ),
  weekly AS (
    SELECT
      ds.user_id,
      COALESCE(SUM(ds.cards_reviewed), 0)::int AS cards_reviewed,
      COUNT(*) FILTER (WHERE ds.goal_achieved = true)::int AS goals_hit
    FROM users.daily_stats ds
    CROSS JOIN week_bounds wb
    INNER JOIN participants pt ON pt.user_id = ds.user_id
    WHERE ds.date >= wb.week_start
      AND ds.date <= wb.week_end
    GROUP BY ds.user_id
  )
  SELECT
    wb.week_start::text AS week_start,
    wb.week_end::text AS week_end,
    pt.nickname,
    pt.is_me,
    COALESCE(w.cards_reviewed, 0) AS cards_reviewed,
    COALESCE(w.goals_hit, 0) AS goals_hit,
    COALESCE(ss.current_streak, 0)::int AS current_streak
  FROM participants pt
  CROSS JOIN week_bounds wb
  LEFT JOIN weekly w ON w.user_id = pt.user_id
  LEFT JOIN users.streak_stats ss ON ss.user_id = pt.user_id
  ORDER BY pt.nickname ASC
`;
