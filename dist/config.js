"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgresOptions = exports.redisOptions = exports.jwtConfig = exports.parserOptions = exports.routerLog = exports.consoleLog = exports.port = exports.environment = exports.corsUrl = exports.serviceName = void 0;
exports.serviceName = process.env.SERVICE_NAME;
exports.corsUrl = process.env.CORS_URL;
exports.environment = process.env.NODE_ENV;
exports.port = parseInt(process.env.API_PORT);
exports.consoleLog = {
    format: process.env.CONSOLE_LOG_FORMAT || 'plain',
    level: process.env.CONSOLE_LOG_LEVEL || 'error',
};
exports.routerLog = {
    active: Boolean(process.env.ROUTER_LOG_ACTIVATION || false),
    format: process.env.ROUTER_LOG_FORMAT,
};
exports.parserOptions = {
    json: { limit: '10mb' },
    urlencoded: {
        limit: '10mb',
        extended: true,
        parameterLimit: 50000,
    },
};
exports.jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES,
};
exports.redisOptions = {
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    url: process.env.REDIS_URL,
};
exports.postgresOptions = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
    connectionTimeoutMillis: process.env.POSTGRES_CONNECTION_TIMEOUT
        ? parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT, 10)
        : 2000,
    idleTimeoutMillis: process.env.POSTGRES_IDLE_TIMEOUT
        ? parseInt(process.env.POSTGRES_IDLE_TIMEOUT, 10)
        : 3000,
    max: process.env.POSTGRES_POOL_SIZE ? parseInt(process.env.POSTGRES_POOL_SIZE, 10) : 10,
};
