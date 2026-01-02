import { PoolClient, QueryResult } from 'pg';
import Postgres, { Query } from '../index';
import { DatabaseError } from '../../../exceptions';

export interface PgTransaction {
  query(req: Query): Promise<QueryResult<any>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export default class Table {
  constructor(protected readonly schemaName: string = 'public') {}

  private async exec<R>(req: Query, client?: PoolClient) {
    if (client) return client.query(req);
    return Postgres.query(req);
  }

  async getItems<R>(req: Query, client?: PoolClient): Promise<R[] | []> {
    const { rows } = await this.exec<R[]>(req, client);

    return rows.length ? rows : [];
  }

  async getItem<R>(req: Query, client?: PoolClient): Promise<R | null> {
    const { rows } = await this.exec<R[]>(req, client);

    return rows.length ? rows[0] : null;
  }

  async exists(req: Query, client?: PoolClient): Promise<boolean> {
    const { rows } = await this.exec(req, client);
    return rows?.[0]?.exists ?? false;
  }

  async updateItems(req: Query, client?: PoolClient): Promise<number> {
    const { rowCount } = await this.exec(req, client);
    if (!rowCount) {
      throw new DatabaseError('Cannot update items');
    }

    return rowCount;
  }

  async insertItem<R>(
    req: Query,
    returnField: string = 'id',
    client?: PoolClient
  ): Promise<R | null> {
    const { rows } = await this.exec(req, client);
    if (!rows?.length) return null;

    return rows[0][returnField] as R;
  }

  async runQuery(req: Query, client?: PoolClient): Promise<void> {
    await this.exec(req, client);
  }

  async runQueryWithResult(req: Query, client?: PoolClient): Promise<any> {
    return await this.exec(req, client);
  }

  async startTransaction() {
    return await Postgres.transaction();
  }
}
