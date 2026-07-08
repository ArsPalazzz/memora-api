import { createClient } from 'redis';
import logger from '../../logger';

import { RedisInstance } from './redis.types';

export default class RedisClient {
  private static instance: RedisInstance;

  static async createConnection(url: string): Promise<RedisInstance | null> {
    if (RedisClient.instance) {
      return this.instance;
    }

    try {
      const client = createClient({ url });

      this.instance = await client.connect();

      logger.info('🗂️  :: Redis client is connected');

      this.instance.on('ready', () => logger.info('Redis client is ready'));
      this.instance.on('end', () => logger.info('Redis connection is closed'));
      this.instance.on('reconnecting', () => {
        logger.info('Redis client is reconnecting');
      });

      return this.instance;
    } catch (e) {
      logger.warn('Cannot create connection to Redis', e);
      return null;
    }
  }

  static ex() {
    return RedisClient.instance;
  }

  static isConnected(): boolean {
    if (!RedisClient.instance) throw Error('There is no connection to Redis');

    try {
      return RedisClient.instance.isOpen;
    } catch (e) {
      return false;
    }
  }

  static async close(): Promise<void> {
    if (!RedisClient.instance) throw Error('There is no connection to Redis');

    await RedisClient.instance.disconnect();

    logger.info('🗂️  :: Redis client is disconnected');

    return;
  }
}
