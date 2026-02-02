"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../exceptions/index");
const pg_1 = require("pg");
class Postgres {
    constructor(pool) {
        this.pool = pool;
    }
    static async createConnection(config) {
        if (Postgres.instance) {
            return this.instance;
        }
        try {
            const pool = new pg_1.Pool(config);
            await pool.query('SELECT NOW()');
            this.instance = new Postgres(pool);
            logger_1.default.info('🗂️  :: Postgres is connected');
            return this.instance;
        }
        catch (e) {
            logger_1.default.error('Cannot create connection to Postgres', e);
        }
    }
    static async query(req) {
        try {
            const start = Date.now();
            if (!Postgres.instance) {
                throw new Error(`Postgres instance is undefined`);
            }
            const res = await Postgres.instance.pool.query(req);
            const duration = Date.now() - start;
            logger_1.default.info(`SQL query: ${req.name} ~ ${duration} (ms)`);
            return res;
        }
        catch (error) {
            logger_1.default.error(`SQL query: ${req.name} > ${error}`);
            if (error.message.includes('Postgres instance')) {
                throw new index_1.DatabaseError(error.message);
            }
            if (error.message.includes('getaddrinfo')) {
                throw new index_1.DatabaseError('Database connection was terminated');
            }
            throw new index_1.DatabaseError(error.message);
        }
    }
    static async getClient() {
        if (!Postgres.instance) {
            throw new index_1.DatabaseError('Postgres instance is undefined');
        }
        return await Postgres.instance.pool.connect();
    }
    static async transaction() {
        const client = await this.getClient();
        await client.query('BEGIN');
        return {
            async query(req) {
                const start = Date.now();
                const res = await client.query(req);
                const duration = Date.now() - start;
                logger_1.default.info(`TX SQL: ${req.name} ~ ${duration}ms`);
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
    static async isConnected() {
        if (!Postgres.instance)
            logger_1.default.error('There is no connection to Postgres');
        try {
            const res = await Postgres.instance.pool.query('SELECT NOW()');
            return !!res;
        }
        catch (e) {
            return false;
        }
    }
    static async close() {
        if (!Postgres.instance)
            logger_1.default.error('There is no connection to Postgres');
        await Postgres.instance.pool.end();
        logger_1.default.info('🗂️  :: Postgres is disconnected');
        return;
    }
}
exports.default = Postgres;
