import { RedisInstance } from '../../../databases/redis/redis.types';
import logger from '../../../logger';
import { DuelResponse } from './duel.types';

const LOBBY_TTL_SECONDS = 30 * 60;
const LOBBY_KEY_PREFIX = 'duel:lobby:';
const LOBBY_UPDATES_CHANNEL = 'duel:lobby:updates';

interface MemoryEntry {
  state: DuelResponse;
  expiresAt: number;
}

export type DuelLobbyUpdateListener = (duelId: string, state: DuelResponse) => void;

export class DuelLobbyCache {
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly listeners = new Set<DuelLobbyUpdateListener>();
  private redis: RedisInstance | null = null;
  private subscriber: RedisInstance | null = null;

  async init(redis: RedisInstance | null): Promise<void> {
    this.redis = redis;

    if (!redis) {
      return;
    }

    try {
      this.subscriber = redis.duplicate();
      await this.subscriber.connect();
      await this.subscriber.subscribe(LOBBY_UPDATES_CHANNEL, (message) => {
        this.handleRemoteUpdate(message).catch((error) => {
          logger.warn('Failed to handle duel lobby pub/sub message', { error });
        });
      });
    } catch (error) {
      logger.warn('Duel lobby cache pub/sub disabled', { error });
      this.subscriber = null;
    }
  }

  async get(duelId: string): Promise<DuelResponse | null> {
    const memoryEntry = this.memory.get(duelId);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      return memoryEntry.state;
    }

    if (memoryEntry) {
      this.memory.delete(duelId);
    }

    if (!this.redis) {
      return null;
    }

    try {
      const raw = await this.redis.get(`${LOBBY_KEY_PREFIX}${duelId}`);
      if (!raw) {
        return null;
      }

      const state = JSON.parse(raw) as DuelResponse;
      this.setMemory(duelId, state);
      return state;
    } catch (error) {
      logger.warn('Failed to read duel lobby cache from Redis', { duelId, error });
      return null;
    }
  }

  async set(duelId: string, state: DuelResponse): Promise<void> {
    this.setMemory(duelId, state);

    if (this.redis) {
      try {
        await this.redis.setEx(
          `${LOBBY_KEY_PREFIX}${duelId}`,
          LOBBY_TTL_SECONDS,
          JSON.stringify(state)
        );
      } catch (error) {
        logger.warn('Failed to write duel lobby cache to Redis', { duelId, error });
      }
    }
  }

  async publishRemote(duelId: string, state: DuelResponse): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.publish(
        LOBBY_UPDATES_CHANNEL,
        JSON.stringify({ duelId, state })
      );
    } catch (error) {
      logger.warn('Failed to publish duel lobby update', { duelId, error });
    }
  }

  subscribe(listener: DuelLobbyUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async close(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(LOBBY_UPDATES_CHANNEL);
      await this.subscriber.quit();
      this.subscriber = null;
    }
  }

  private setMemory(duelId: string, state: DuelResponse) {
    this.memory.set(duelId, {
      state,
      expiresAt: Date.now() + LOBBY_TTL_SECONDS * 1000,
    });
  }

  private async handleRemoteUpdate(message: string) {
    const payload = JSON.parse(message) as { duelId: string; state: DuelResponse };
    this.setMemory(payload.duelId, payload.state);
    this.listeners.forEach((listener) => listener(payload.duelId, payload.state));
  }
}

export default new DuelLobbyCache();
