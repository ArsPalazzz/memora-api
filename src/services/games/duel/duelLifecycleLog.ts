import logger from '../../../logger';

export type DuelLifecycleEvent =
  | 'duel.created'
  | 'duel.joined'
  | 'duel.left'
  | 'duel.cancelled'
  | 'duel.started'
  | 'duel.racing'
  | 'duel.finished'
  | 'duel.forfeit'
  | 'duel.disconnect'
  | 'duel.desk_cancelled';

export function logDuelLifecycle(
  event: DuelLifecycleEvent,
  fields: Record<string, string | number | boolean | null | undefined>
) {
  logger.info(event, {
    metric: event,
    component: 'duel',
    ...fields,
  });
}
