export const GET_CHALLENGE_LEADERBOARD = `
  WITH participants AS (
    SELECT
      p.sub AS user_sub,
      p.nickname,
      dle.local_desk_sub,
      (p.sub = $1) AS is_me
    FROM cards.desk_library_entry dle
    INNER JOIN users.profile p ON p.sub = dle.user_sub
    WHERE dle.source_desk_sub = $2
      AND (
        dle.user_sub = $1
        OR (
          p.stats_public = true
          AND EXISTS (
            SELECT 1
            FROM users.friendship f
            WHERE f.status = 'accepted'
              AND (
                (f.requester_sub = $1 AND f.addressee_sub = p.sub)
                OR (f.requester_sub = p.sub AND f.addressee_sub = $1)
              )
          )
        )
      )
  ),
  weekly AS (
    SELECT
      s.user_sub,
      COUNT(sc.id)::int AS cards_reviewed
    FROM games.session s
    INNER JOIN games.session_card sc ON sc.session_id = s.id
    INNER JOIN participants pt
      ON pt.user_sub = s.user_sub
     AND pt.local_desk_sub = s.desk_sub
    WHERE s.status = 'finished'
      AND sc.answered_at IS NOT NULL
      AND sc.answered_at >= date_trunc('week', timezone('UTC', now()))
      AND sc.answered_at < date_trunc('week', timezone('UTC', now())) + interval '7 days'
    GROUP BY s.user_sub
  )
  SELECT
    pt.nickname,
    pt.is_me,
    pt.local_desk_sub,
    COALESCE(w.cards_reviewed, 0)::int AS cards_reviewed
  FROM participants pt
  LEFT JOIN weekly w ON w.user_sub = pt.user_sub
  ORDER BY cards_reviewed DESC, pt.nickname ASC
`;

export const GET_AUTO_WEEKLY_CHALLENGE_DESK = `
  WITH public_desks AS (
    SELECT
      d.sub,
      COALESCE(SUM(c.global_like_count), 0)::int AS total_saves,
      d.created_at
    FROM cards.desk d
    LEFT JOIN cards.card c ON c.desk_sub = d.sub
    WHERE d.visibility = 'public'
      AND d.status = 'active'
      AND d.is_inbox = false
    GROUP BY d.sub, d.created_at
  ),
  ranked AS (
    SELECT
      sub,
      ROW_NUMBER() OVER (ORDER BY total_saves DESC, created_at ASC)::int AS rank
    FROM public_desks
  ),
  pool AS (
    SELECT sub, rank
    FROM ranked
    WHERE rank <= 5
  ),
  week_pick AS (
    SELECT (
      EXTRACT(WEEK FROM timezone('UTC', now()))::int
      % GREATEST((SELECT COUNT(*)::int FROM pool), 1)
    ) + 1 AS pick_rank
  )
  SELECT p.sub
  FROM pool p
  CROSS JOIN week_pick wp
  WHERE p.rank = wp.pick_rank
  ORDER BY p.rank ASC
  LIMIT 1
`;
