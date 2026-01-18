export const CREATE_GAME_SESSION = `
  INSERT INTO games.session(id, user_sub, type, mode, desk_sub, status, created_at)
    VALUES($1,$2,'desk','write',$3,'active',NOW())`;

export const CREATE_REVIEW_SESSION = `
  INSERT INTO games.session(id, user_sub, type, mode, batch_id, status, created_at)
    VALUES($1,$2,'review','write',$3,'active',NOW())`;

export const HAVE_ACCESS_TO_SESSION = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1 AND user_sub = $2);
`;

export const EXIST_BY_SESSION_ID = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1);
`;

export const IS_SESSION_ACTIVE = `
  SELECT EXISTS (SELECT 1 FROM games.session WHERE id = $1 AND status = 'active');
`;

export const GET_WEEKLY_DESK_STATS = `
  SELECT json_build_object(
      'current', json_build_object(
          'mon', COALESCE(cw.attempts_mon, 0),
          'tue', COALESCE(cw.attempts_tue, 0),
          'wed', COALESCE(cw.attempts_wed, 0),
          'thu', COALESCE(cw.attempts_thu, 0),
          'fri', COALESCE(cw.attempts_fri, 0),
          'sat', COALESCE(cw.attempts_sat, 0),
          'sun', COALESCE(cw.attempts_sun, 0)
      ),
      'previous', json_build_object(
          'mon', COALESCE(pw.attempts_mon, 0),
          'tue', COALESCE(pw.attempts_tue, 0),
          'wed', COALESCE(pw.attempts_wed, 0),
          'thu', COALESCE(pw.attempts_thu, 0),
          'fri', COALESCE(pw.attempts_fri, 0),
          'sat', COALESCE(pw.attempts_sat, 0),
          'sun', COALESCE(pw.attempts_sun, 0)
      )
  ) AS weekly_attempts
  FROM
  (
      SELECT
          MAX(CASE WHEN weekday = 1 THEN attempts END) AS attempts_mon,
          MAX(CASE WHEN weekday = 2 THEN attempts END) AS attempts_tue,
          MAX(CASE WHEN weekday = 3 THEN attempts END) AS attempts_wed,
          MAX(CASE WHEN weekday = 4 THEN attempts END) AS attempts_thu,
          MAX(CASE WHEN weekday = 5 THEN attempts END) AS attempts_fri,
          MAX(CASE WHEN weekday = 6 THEN attempts END) AS attempts_sat,
          MAX(CASE WHEN weekday = 7 THEN attempts END) AS attempts_sun
      FROM (
          SELECT EXTRACT(ISODOW FROM sc.answered_at)::int AS weekday,
                COUNT(*) AS attempts
          FROM games.session s
          JOIN games.session_card sc ON sc.session_id = s.id
          WHERE s.user_sub = $1
            AND s.desk_sub = $2
            AND s.status = 'finished'
            AND sc.answered_at >= date_trunc('week', NOW())
            AND sc.answered_at < NOW()
          GROUP BY weekday
      ) t
  ) cw
  CROSS JOIN
  (
      SELECT
          MAX(CASE WHEN weekday = 1 THEN attempts END) AS attempts_mon,
          MAX(CASE WHEN weekday = 2 THEN attempts END) AS attempts_tue,
          MAX(CASE WHEN weekday = 3 THEN attempts END) AS attempts_wed,
          MAX(CASE WHEN weekday = 4 THEN attempts END) AS attempts_thu,
          MAX(CASE WHEN weekday = 5 THEN attempts END) AS attempts_fri,
          MAX(CASE WHEN weekday = 6 THEN attempts END) AS attempts_sat,
          MAX(CASE WHEN weekday = 7 THEN attempts END) AS attempts_sun
      FROM (
          SELECT EXTRACT(ISODOW FROM sc.answered_at)::int AS weekday,
                COUNT(*) AS attempts
          FROM games.session s
          JOIN games.session_card sc ON sc.session_id = s.id
          WHERE s.user_sub = $1
            AND s.desk_sub = $2
            AND s.status = 'finished'
            AND sc.answered_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
            AND sc.answered_at < date_trunc('week', NOW())
          GROUP BY weekday
      ) t
  ) pw;
`;

export const FINISH_SESSION = `
  UPDATE games.session SET status = 'finished' WHERE id = $1;
`;

export const GET_NEXT_UNANSWERED_CARD = `
  SELECT
    sc.id            AS "sessionCardId",
    sc.card_sub AS "cardSub",
    sc.direction,
    c.front_variants AS "frontVariants",
    c.back_variants AS "backVariants"
  FROM games.session_card sc
  JOIN games.session s ON s.id = sc.session_id
  JOIN cards.card c ON c.sub = sc.card_sub
    WHERE sc.session_id = $1
      AND s.user_sub = $2
      AND sc.answered_at IS NULL
  ORDER BY sc.id
  LIMIT 1;
`;

export const SAVE_ANSWER = `
  UPDATE games.session_card
  SET
    user_answer = $1,
    is_correct = $2,
    answered_at = NOW()
  WHERE id = $3;
`;

export const HAS_UNANSWERED_CARDS = `
  SELECT EXISTS (
    SELECT 1
    FROM games.session_card
      WHERE session_id = $1
        AND answered_at IS NULL
    LIMIT 1
  );
`;
