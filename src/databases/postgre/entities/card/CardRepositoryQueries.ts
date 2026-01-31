export const INSERT_CARD = `
  INSERT INTO cards.card (desk_sub, front_variants, back_variants, sub) VALUES ($1, $2::jsonb, $3::jsonb, $4) RETURNING *;
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

export const EXIST_DESK_WITH_THIS_TITLE = `
  SELECT EXISTS (
    SELECT 1 
    FROM cards.desk d
    INNER JOIN cards.folder_desk fd ON fd.desk_sub = d.sub
    WHERE d.title = $1
      AND fd.folder_sub IS NULL
      AND d.creator_sub = $2
  );
`;

export const EXIST_DESK_WITH_THIS_TITLE_AND_FOLDER = `
  SELECT EXISTS (
    SELECT 1 
    FROM cards.desk d
    INNER JOIN cards.folder_desk fd ON fd.desk_sub = d.sub
    WHERE d.title = $1
      AND fd.folder_sub = $2
      AND d.creator_sub = $3
  );
`;

export const EXIST_FOLDER_WITH_THIS_TITLE_AND_PARENT = `
  SELECT EXISTS (
    SELECT 1 
    FROM cards.folder
    WHERE title = $1
      AND parent_folder_sub = $2
      AND creator_sub = $3
  );
`;

export const EXIST_FOLDER_WITH_THIS_TITLE = `
  SELECT EXISTS (
    SELECT 1 
    FROM cards.folder
    WHERE title = $1
      AND parent_folder_sub IS NULL
      AND creator_sub = $2
  );
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

export const UPDATE_FEED_CARD_ORIENTATION = `
  UPDATE cards.feed_settings SET card_orientation = $1 WHERE user_sub = $2;
`;

export const UPDATE_CARD = `
  UPDATE cards.card SET front_variants = $2::jsonb, back_variants = $3::jsonb WHERE sub = $1;
`;

export const GET_CARD = `
 SELECT 
    c.sub,
    c.created_at,
    c.front_variants AS "front_variants",
    c.back_variants AS "back_variants",
    COALESCE(
        array_agg(ce.sentence ORDER BY ce.created_at) FILTER (WHERE ce.id IS NOT NULL),
        ARRAY[]::text[]
    ) AS examples
FROM cards.card c
LEFT JOIN cards.card_examples ce ON ce.card_sub = c.sub
WHERE c.sub = $1
GROUP BY 
    c.sub, 
    c.created_at, 
    c.front_variants, 
    c.back_variants;
`;

export const ARCHIVE_DESK = `
  UPDATE cards.desk SET status = 'archived' WHERE sub = $1;
`;

export const RESTORE_DESK = `
  UPDATE cards.desk SET status = 'active' WHERE sub = $1;
`;

export const DELETE_CARD = `
  DELETE FROM cards.card WHERE sub = $1;
`;

export const INSERT_DESK = `
  INSERT INTO cards.desk (sub, title, description, public, creator_sub) VALUES ($1, $2, $3, $4, $5) RETURNING created_at;
`;

export const INSERT_FOLDER = `
  INSERT INTO cards.folder (sub, title, description, creator_sub, parent_folder_sub) VALUES ($1, $2, $3, $4, $5) RETURNING created_at;
`;

export const EXIST_FOLDER_BY_SUB = `
  SELECT EXISTS (SELECT 1 FROM cards.folder WHERE sub = $1);
`;

export const ADD_DESK_TO_FOLDER = `
  INSERT INTO cards.folder_desk (folder_sub, desk_sub) VALUES ($1,$2);
`;

export const HAVE_ACCESS_TO_FOLDER = `
  SELECT EXISTS (SELECT 1 FROM cards.folder WHERE sub = $1 AND creator_sub = $2);
`;

export const GET_FOLDER_TREE = `
  WITH RECURSIVE folder_tree AS (
    -- Базовый случай: корневые папки
    SELECT 
      f.sub,
      f.title,
      f.description,
      f.parent_folder_sub AS "parentFolderSub",
      f.created_at AS "createdAt",
      1 AS level,
      ARRAY[f.sub] AS path,
      -- Количество досок
      (
        SELECT COUNT(*)
        FROM cards.folder_desk fd
        WHERE fd.folder_sub = f.sub
      ) AS "deskCount",
      -- Количество дочерних папок
      (
        SELECT COUNT(*)
        FROM cards.folder fc
        WHERE fc.parent_folder_sub = f.sub
      ) AS "childCount"
    FROM cards.folder f
    WHERE f.creator_sub = $1 
      AND f.parent_folder_sub IS NULL
    
    UNION ALL
    
    -- Рекурсивный случай
    SELECT 
      f.sub,
      f.title,
      f.description,
      f.parent_folder_sub AS "parentFolderSub",
      f.created_at AS "createdAt",
      ft.level + 1 AS level,
      ft.path || f.sub AS path,
      (
        SELECT COUNT(*)
        FROM cards.folder_desk fd
        WHERE fd.folder_sub = f.sub
      ) AS "deskCount",
      (
        SELECT COUNT(*)
        FROM cards.folder fc
        WHERE fc.parent_folder_sub = f.sub
      ) AS "childCount"
    FROM cards.folder f
    INNER JOIN folder_tree ft ON f.parent_folder_sub = ft.sub
    WHERE f.creator_sub = $1
  )
  SELECT 
    ft.sub,
    ft.title,
    ft.description,
    ft."parentFolderSub",
    ft."createdAt",
    ft."deskCount",
    ft."childCount",
    ft.level,
    ft.path,
    -- Получаем дочерние элементы как JSON
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'sub', c.sub,
            'title', c.title,
            'description', c.description,
            'parentFolderSub', c."parentFolderSub",
            'createdAt', c."createdAt",
            'deskCount', c."deskCount",
            'childCount', c."childCount",
            'level', c.level,
            'path', c.path,
            'children', '[]'::jsonb  -- Пустые children на этом уровне
          )
          ORDER BY c."createdAt"
        )
        FROM folder_tree c
        WHERE c."parentFolderSub" = ft.sub
      ),
      '[]'::jsonb
    ) AS children
  FROM folder_tree ft
  WHERE ft."parentFolderSub" IS NULL
  ORDER BY ft."createdAt" ASC;
`;

export const GET_FOLDER_CONTENTS = `
  -- Прямые дочерние папки (с подсчетом через отдельные рекурсивные запросы)
  SELECT
    f.sub,
    f.title,
    f.description,
    f.parent_folder_sub AS "parentFolderSub",
    f.created_at AS "createdAt",
    'folder' AS type,
    'active' AS status,
    
    NULL AS "totalCards",
    NULL AS "newCards",
    NULL AS "dueCards",
    NULL AS "learningCards",
    NULL AS "masteredCards",
    
    -- Доски в этой папке и всех её потомках
    (
      WITH RECURSIVE folder_tree AS (
        SELECT sub FROM cards.folder WHERE sub = f.sub
        UNION ALL
        SELECT fc.sub FROM cards.folder fc
        INNER JOIN folder_tree ft ON fc.parent_folder_sub = ft.sub
        WHERE fc.creator_sub = $2
      )
      SELECT COUNT(DISTINCT fd.desk_sub)
      FROM folder_tree ft
      LEFT JOIN cards.folder_desk fd ON fd.folder_sub = ft.sub
    ) AS "deskCount",
    
    -- Папки-потомки (включая вложенные)
    (
      WITH RECURSIVE folder_tree AS (
        SELECT sub, 1 as level FROM cards.folder WHERE sub = f.sub
        UNION ALL
        SELECT fc.sub, ft.level + 1 FROM cards.folder fc
        INNER JOIN folder_tree ft ON fc.parent_folder_sub = ft.sub
        WHERE fc.creator_sub = $2
      )
      SELECT COUNT(*) - 1 FROM folder_tree
    ) AS "childCount"
    
  FROM cards.folder f
  WHERE f.parent_folder_sub = $1
    AND f.creator_sub = $2
  
  UNION ALL
  
  -- Доски в текущей папке
  SELECT
    d.sub,
    d.title,
    d.description,
    NULL AS "parentFolderSub",
    d.created_at AS "createdAt",
    'desk' AS type,
    d.status,
    
    COUNT(DISTINCT c.sub) AS "totalCards",
    COUNT(
      DISTINCT CASE
        WHEN ucs.repetitions IS NULL OR ucs.repetitions = 0
        THEN c.sub
      END
    ) AS "newCards",
    COUNT(
      DISTINCT CASE
        WHEN ucs.next_review <= NOW()
        THEN c.sub
      END
    ) AS "dueCards",
    COUNT(
      DISTINCT CASE
        WHEN ucs.repetitions > 0
             AND (ucs.next_review > NOW() OR ucs.next_review IS NULL)
             AND ucs.interval_minutes <= 43200
        THEN c.sub
      END
    ) AS "learningCards",
    COUNT(
      DISTINCT CASE
        WHEN ucs.interval_minutes > 43200
        THEN c.sub
      END
    ) AS "masteredCards",
    
    0 AS "deskCount",
    0 AS "childCount"
    
  FROM cards.desk d
  INNER JOIN cards.folder_desk fd ON fd.desk_sub = d.sub
  LEFT JOIN cards.card c ON c.desk_sub = d.sub
  LEFT JOIN cards.user_card_srs ucs ON ucs.card_sub = c.sub AND ucs.user_sub = $2
  WHERE fd.folder_sub = $1
    AND d.creator_sub = $2
    AND d.status = 'active'
  GROUP BY d.sub, d.title, d.description, d.status, d.created_at
`;
export const GET_FOLDER_INFO = `
  SELECT 
    f.sub,
    f.title,
    f.description,
    f.parent_folder_sub AS "parentFolderSub",
    f.created_at AS "createdAt",
    COUNT(DISTINCT fd.desk_sub) AS "deskCount",
    (
      SELECT COUNT(*)
      FROM cards.folder fc
      WHERE fc.parent_folder_sub = f.sub
    ) AS "childCount"
  FROM cards.folder f
  LEFT JOIN cards.folder_desk fd ON fd.folder_sub = f.sub
  WHERE f.sub = $1
  GROUP BY f.sub, f.title, f.description, f.parent_folder_sub, f.created_at;
`;

export const GET_ROOT_FOLDERS = `
  WITH RECURSIVE folder_tree AS (
    -- Базовый случай: корневые папки (те, которые нам нужно вернуть)
    SELECT 
      f.sub,
      f.parent_folder_sub,
      f.sub AS root_folder_sub,  -- Запоминаем корневую папку для группировки
      1 AS depth
    FROM cards.folder f
    WHERE f.creator_sub = $1
      AND f.parent_folder_sub IS NULL
    
    UNION ALL
    
    -- Рекурсивный случай: все дочерние папки (включая вложенные)
    SELECT 
      f.sub,
      f.parent_folder_sub,
      ft.root_folder_sub,  -- Сохраняем ссылку на корневую папку
      ft.depth + 1
    FROM cards.folder f
    INNER JOIN folder_tree ft ON f.parent_folder_sub = ft.sub
    WHERE f.creator_sub = $1
  )
  
  SELECT 
    ft_root.sub,
    ft_root.title,
    ft_root.description,
    ft_root.parent_folder_sub,
    ft_root.created_at AS "createdAt",
    -- Считаем ВСЕ доски во ВСЕХ папках дерева (включая корневую и все вложенные)
    COUNT(DISTINCT fd.desk_sub) AS "deskCount",
    -- Считаем ВСЕ папки в дереве (включая корневую)
    COUNT(DISTINCT ft_all.sub) - 1 AS "childCount"  -- -1 чтобы исключить саму корневую папку
  FROM cards.folder ft_root
  -- Присоединяем ВСЕ папки в дереве (включая саму корневую)
  LEFT JOIN folder_tree ft_all ON ft_all.root_folder_sub = ft_root.sub
  -- Присоединяем все доски во всех папках дерева
  LEFT JOIN cards.folder_desk fd ON fd.folder_sub = ft_all.sub
  WHERE ft_root.creator_sub = $1
    AND ft_root.parent_folder_sub IS NULL
  GROUP BY 
    ft_root.sub,
    ft_root.title,
    ft_root.description,
    ft_root.parent_folder_sub,
    ft_root.created_at
  ORDER BY ft_root.created_at DESC;
`;

export const INSERT_DESK_SETTINGS = `
  INSERT INTO cards.desk_settings (desk_sub) VALUES ($1);
`;

export const GET_CARDS = `
  SELECT * FROM cards.card ORDER BY created_at DESC;
`;

export const GET_CARD_SUBS_FOR_PLAY = `
    SELECT sub
    FROM cards.card
    WHERE desk_sub = $1
    ORDER BY random()
    LIMIT $2
`;

export const GET_DESKS_BY_CREATOR_SUB = `
  SELECT
  d.sub,
  d.title,
  d.description,
  d.status,

  COUNT(DISTINCT c.sub) AS "totalCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions IS NULL OR ucs.repetitions = 0
      THEN c.sub
    END
  ) AS "newCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.next_review <= NOW()
      THEN c.sub
    END
  ) AS "dueCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions > 0
           AND (ucs.next_review > NOW() OR ucs.next_review IS NULL)
           AND ucs.interval_minutes <= 43200
      THEN c.sub
    END
  ) AS "learningCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.interval_minutes > 43200
      THEN c.sub
    END
  ) AS "masteredCards" -- FIX

FROM cards.desk d
LEFT JOIN cards.card c
  ON c.desk_sub = d.sub
LEFT JOIN cards.user_card_srs ucs
  ON ucs.card_sub = c.sub
 AND ucs.user_sub = $1
LEFT JOIN cards.folder_desk fd
  ON fd.desk_sub = d.sub

WHERE d.creator_sub = $1 AND fd.desk_sub IS NULL

GROUP BY
  d.sub,
  d.title,
  d.status,
  d.description,
  d.created_at

ORDER BY d.created_at DESC;
`;

export const GET_ARCHIVED_DESKS_BY_CREATOR_SUB = `
  SELECT
  d.sub,
  d.title,
  d.description,
  d.status,

  COUNT(DISTINCT c.sub) AS "totalCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions IS NULL OR ucs.repetitions = 0
      THEN c.sub
    END
  ) AS "newCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.next_review <= NOW()
      THEN c.sub
    END
  ) AS "dueCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.repetitions > 0
           AND (ucs.next_review > NOW() OR ucs.next_review IS NULL)
           AND ucs.interval_minutes <= 43200
      THEN c.sub
    END
  ) AS "learningCards", -- FIX

  COUNT(
    DISTINCT CASE
      WHEN ucs.interval_minutes > 43200
      THEN c.sub
    END
  ) AS "masteredCards" -- FIX

FROM cards.desk d
LEFT JOIN cards.card c
  ON c.desk_sub = d.sub
LEFT JOIN cards.user_card_srs ucs
  ON ucs.card_sub = c.sub
 AND ucs.user_sub = $1

WHERE d.creator_sub = $1 AND d.status = 'archived'

GROUP BY
  d.sub,
  d.title,
  d.status,
  d.description,
  d.created_at

ORDER BY d.created_at DESC;
`;

export const GET_DESK_SUBS_BY_CREATOR_SUB = `
  SELECT sub, title FROM cards.desk WHERE creator_sub = $1 ORDER BY created_at DESC;
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
  ),
  desk_cards AS (
    SELECT 
      c.sub,
      c.front_variants,
      c.back_variants,
      c.created_at,
      ucs.repetitions,
      ucs.interval_minutes,
      ucs.ease_factor,
      ucs.next_review,
      ucs.last_review,
      COALESCE(
        json_agg(ce.sentence ORDER BY ce.created_at) FILTER (WHERE ce.sentence IS NOT NULL),
        '[]'::json
      ) as examples
    FROM cards.card c
    LEFT JOIN cards.user_card_srs ucs ON ucs.card_sub = c.sub AND ucs.user_sub = $2
    LEFT JOIN cards.card_examples ce ON ce.card_sub = c.sub
    WHERE c.desk_sub = $1
    GROUP BY 
      c.sub, c.front_variants, c.back_variants, c.created_at,
      ucs.repetitions, ucs.interval_minutes, ucs.ease_factor, 
      ucs.next_review, ucs.last_review
  ),
  stats_calculation AS (
    SELECT 
      COUNT(*) as total_cards,
      COUNT(CASE WHEN repetitions = 0 OR repetitions IS NULL THEN 1 END) as new_cards,
      COUNT(CASE WHEN next_review <= NOW() THEN 1 END) as due_today,
      COUNT(CASE WHEN interval_minutes > 43200 THEN 1 END) as mastered_cards,
      COALESCE(AVG(COALESCE(ease_factor, 2.5)), 0) as avg_ease_factor
    FROM desk_cards
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
          'sub', dc.sub,
          'front_variants', dc.front_variants,
          'back_variants', dc.back_variants,
          'created_at', dc.created_at,
          'examples', dc.examples
        )
        ORDER BY dc.created_at DESC
      ) FILTER (WHERE dc.sub IS NOT NULL), '[]'
    ) AS cards,
    json_build_object(
      'total_cards', sc.total_cards,
      'new_cards', sc.new_cards,
      'due_today', sc.due_today,
      'mastered_cards', sc.mastered_cards,
      'avg_ease_factor', sc.avg_ease_factor
    ) AS stats
  FROM desk_data dd
  LEFT JOIN desk_cards dc ON true
  LEFT JOIN stats_calculation sc ON true
  GROUP BY 
    dd.sub, dd.title, dd.description, dd.created_at, 
    dd.cards_per_session, dd.card_orientation,
    sc.total_cards, sc.new_cards, sc.due_today, sc.mastered_cards, sc.avg_ease_factor;
`;

export const GET_DESK_CARDS = `
SELECT 
    c.sub,
    c.created_at AS "createdAt",
    c.front_variants AS "frontVariants",
    c.back_variants AS "backVariants",
    COALESCE(
        array_agg(ce.sentence ORDER BY ce.created_at) FILTER (WHERE ce.id IS NOT NULL),
        ARRAY[]::text[]
    ) AS examples
FROM cards.card c
LEFT JOIN cards.card_examples ce ON ce.card_sub = c.sub
WHERE c.desk_sub = $1
GROUP BY 
    c.sub, 
    c.created_at, 
    c.front_variants, 
    c.back_variants
ORDER BY c.created_at DESC;
`;
