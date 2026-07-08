import { mapAvatarUrl } from '../../../utils/avatarUrl';
import { DuelPlayerRow, DuelResponse, DuelRow } from './duel.types';

export function formatDuelResponse(duel: DuelRow, players: DuelPlayerRow[]): DuelResponse {
  return {
    id: duel.id,
    code: duel.code,
    hostSub: duel.host_sub,
    deskSub: duel.desk_sub,
    deskTitle: duel.desk_title ?? '',
    config: duel.config,
    cardSeed: duel.card_seed ? Number(duel.card_seed) : null,
    cardSubs:
      duel.status === 'racing' || duel.status === 'finished'
        ? (duel.card_subs ?? [])
        : [],
    status: duel.status,
    startedAt: duel.started_at,
    finishedAt: duel.finished_at,
    createdAt: duel.created_at,
    players: players.map((player) => {
      const withAvatar = mapAvatarUrl({
        sub: player.user_sub,
        nickname: player.nickname ?? 'User',
        avatar_key: player.avatar_key ?? null,
      });

      return {
        sub: player.user_sub,
        slot: player.slot,
        ready: player.ready,
        score: player.score,
        correctCount: player.correct_count,
        wrongCount: player.wrong_count,
        totalTimeMs: player.total_time_ms,
        maxStreak: player.max_streak,
        placement: player.placement,
        disconnectedAt: player.disconnected_at,
        joinedAt: player.joined_at,
        nickname: withAvatar.nickname,
        avatar_url: withAvatar.avatar_url,
      };
    }),
  };
}
