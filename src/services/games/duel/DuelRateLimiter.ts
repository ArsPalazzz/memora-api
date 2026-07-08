import {
  DUEL_RACE_RATE_LIMIT_MAX,
  DUEL_RACE_RATE_LIMIT_WINDOW_MS,
} from './duelRace.utils';

export class DuelRateLimiter {
  private readonly hits = new Map<string, number[]>();

  allow(
    key: string,
    maxPerWindow = DUEL_RACE_RATE_LIMIT_MAX,
    windowMs = DUEL_RACE_RATE_LIMIT_WINDOW_MS
  ): boolean {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= maxPerWindow) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  reset(key: string) {
    this.hits.delete(key);
  }
}

export default new DuelRateLimiter();
