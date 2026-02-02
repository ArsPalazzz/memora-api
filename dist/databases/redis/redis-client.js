"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../../logger"));
class RedisClient {
    static async createConnection(url) {
        if (RedisClient.instance) {
            return this.instance;
        }
        try {
            const client = (0, redis_1.createClient)({ url });
            this.instance = await client.connect();
            logger_1.default.info('🗂️  :: Redis client is connected');
            this.instance.on('ready', () => logger_1.default.info('Redis client is ready'));
            this.instance.on('end', () => logger_1.default.info('Redis connection is closed'));
            this.instance.on('reconnecting', (o) => {
                logger_1.default.info('Redis client is reconnecting');
            });
            return this.instance;
        }
        catch (e) {
            logger_1.default.error('Cannot create connection to Redis', e);
        }
    }
    static ex() {
        return RedisClient.instance;
    }
    static isConnected() {
        if (!RedisClient.instance)
            throw Error('There is no connection to Redis');
        try {
            return RedisClient.instance.isOpen;
        }
        catch (e) {
            return false;
        }
    }
    static async close() {
        if (!RedisClient.instance)
            throw Error('There is no connection to Redis');
        await RedisClient.instance.disconnect();
        logger_1.default.info('🗂️  :: Redis client is disconnected');
        return;
    }
}
exports.default = RedisClient;
