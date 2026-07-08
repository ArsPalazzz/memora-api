import { createClient } from 'redis';
import logger from '../../logger';
import { redisOptions } from '../../config';
import RedisClient from './redis-client';
import { RedisInstance } from './redis.types';

export function isRedisEnabled(): boolean {
  return false;
}

export function resolveRedisUrl(): string | null {
  return redisOptions.url ?? null;
}

export async function tryConnectRedis(): Promise<RedisInstance | null> {
  const url = resolveRedisUrl();
  if (!url) {
    return null;
  }

  try {
    const client = await RedisClient.createConnection(url);
    return client;
  } catch (error) {
    logger.warn('Redis unavailable, continuing without Redis', { error });
    return null;
  }
}

export async function createPubSubClients(
  url: string
): Promise<{ pubClient: RedisInstance; subClient: RedisInstance } | null> {
  try {
    const pubClient = createClient({ url }) as RedisInstance;
    const subClient = pubClient.duplicate() as RedisInstance;

    pubClient.on('error', (error) => {
      logger.warn('Redis pub client error', { error });
    });
    subClient.on('error', (error) => {
      logger.warn('Redis sub client error', { error });
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);
    return { pubClient, subClient };
  } catch (error) {
    logger.warn('Redis pub/sub unavailable for Socket.IO adapter', { error });
    return null;
  }
}
