import { DuelRaceFinishedResults } from './duel.types';

export type DuelRaceFinishedListener = (
  duelId: string,
  results: DuelRaceFinishedResults
) => void;

const raceFinishedListeners = new Set<DuelRaceFinishedListener>();

export function subscribeDuelRaceFinished(listener: DuelRaceFinishedListener): () => void {
  raceFinishedListeners.add(listener);
  return () => raceFinishedListeners.delete(listener);
}

export function publishDuelRaceFinished(
  duelId: string,
  results: DuelRaceFinishedResults
): void {
  raceFinishedListeners.forEach((listener) => listener(duelId, results));
}
