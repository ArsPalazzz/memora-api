"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIMIT_USER_TOKENS = exports.GET_ACTIVE_FCM_TOKENS = exports.DEACTIVATE_TOKEN = exports.EXIST_TOKEN = exports.INSERT_TOKEN = void 0;
exports.INSERT_TOKEN = `
   INSERT INTO notifications.fcm_token 
          (user_sub, token, device_info, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (token) 
        DO UPDATE SET 
          user_sub = EXCLUDED.user_sub,
          device_info = EXCLUDED.device_info,
          is_active = true,
          updated_at = NOW(),
          deactivated_at = NULL,
          deactivated_reason = NULL
        RETURNING id;
`;
exports.EXIST_TOKEN = `
  SELECT EXISTS (SELECT 1 FROM notifications.fcm_token WHERE token = $1);
`;
exports.DEACTIVATE_TOKEN = `
  UPDATE notifications.fcm_token 
        SET is_active = false,
            updated_at = NOW(),
            deactivated_at = NOW(),
            deactivated_reason = $2
        WHERE token = $1;
`;
exports.GET_ACTIVE_FCM_TOKENS = `
 SELECT token FROM notifications.fcm_token
        WHERE user_sub = $1 
          AND is_active = true
          AND created_at > NOW() - INTERVAL '90 days'
        ORDER BY updated_at DESC
        LIMIT 5
`;
exports.LIMIT_USER_TOKENS = `
 WITH ranked_tokens AS (
          SELECT token,
                 ROW_NUMBER() OVER (ORDER BY updated_at DESC) as rn
          FROM notifications.fcm_token
          WHERE user_sub = $1 
            AND is_active = true
        )
        UPDATE notifications.fcm_token ft
        SET is_active = false,
            deactivated_reason = 'token_limit_exceeded'
        FROM ranked_tokens rt
        WHERE ft.token = rt.token
          AND rt.rn > $2
`;
