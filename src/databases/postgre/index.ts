import logger from '../../logger';
import { DatabaseError } from '../../exceptions/index';
import { Pool, PoolClient, PoolConfig } from 'pg';

export type Query = {
  name: string;
  text: string;
  values: any[];
};

export default class Postgres {
  private static instance: Postgres;

  constructor(private pool: Pool) {}

  static async createConnection(config: PoolConfig) {
    if (Postgres.instance) {
      return this.instance;
    }

    try {
      const pool = new Pool(config);

      await pool.query('SELECT NOW()');

      this.instance = new Postgres(pool);

      logger.info('🗂️  :: Postgres is connected');

      return this.instance;
    } catch (e) {
      logger.error('Cannot create connection to Postgres', e);
    }
  }

  static async query(req: Query) {
    try {
      const start = Date.now();

      if (!Postgres.instance) {
        throw new Error(`Postgres instance is undefined`);
      }

      const res = await Postgres.instance.pool.query(req);
      const duration = Date.now() - start;

      logger.info(`SQL query: ${req.name} ~ ${duration} (ms)`);

      return res;
    } catch (error) {
      logger.error(`SQL query: ${req.name} > ${error}`);

      if ((error as Error).message.includes('Postgres instance')) {
        throw new DatabaseError((error as Error).message);
      }

      if ((error as Error).message.includes('getaddrinfo')) {
        throw new DatabaseError('Database connection was terminated');
      }

      throw new DatabaseError((error as Error).message);
    }
  }

  static async getClient(): Promise<PoolClient> {
    if (!Postgres.instance) {
      throw new DatabaseError('Postgres instance is undefined');
    }

    return await Postgres.instance.pool.connect();
  }

  static async transaction() {
    const client = await this.getClient();
    await client.query('BEGIN');

    return {
      async query(req: Query) {
        const start = Date.now();
        const res = await client.query(req);
        const duration = Date.now() - start;
        logger.info(`TX SQL: ${req.name} ~ ${duration}ms`);
        return res;
      },

      async commit() {
        await client.query('COMMIT');
        client.release();
      },

      async rollback() {
        await client.query('ROLLBACK');
        client.release();
      },
    };
  }

  static async isConnected(): Promise<boolean> {
    if (!Postgres.instance) logger.error('There is no connection to Postgres');

    try {
      const res = await Postgres.instance.pool.query('SELECT NOW()');

      return !!res;
    } catch (e) {
      return false;
    }
  }

  static async close(): Promise<void> {
    if (!Postgres.instance) logger.error('There is no connection to Postgres');

    await Postgres.instance.pool.end();

    logger.info('🗂️  :: Postgres is disconnected');

    return;
  }
}
