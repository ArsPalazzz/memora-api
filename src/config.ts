export const serviceName = process.env.SERVICE_NAME;
export const corsUrl = process.env.CORS_URL;
export const environment = process.env.NODE_ENV;
export const port = parseInt(process.env.API_PORT!) || 3000;

export const consoleLog = {
  format: process.env.CONSOLE_LOG_FORMAT || 'plain',
  level: process.env.CONSOLE_LOG_LEVEL || 'error',
};

export const routerLog = {
  active: Boolean(process.env.ROUTER_LOG_ACTIVATION || false),
  format: process.env.ROUTER_LOG_FORMAT!,
};

export const parserOptions = {
  json: { limit: '10mb' },
  urlencoded: {
    limit: '10mb',
    extended: true,
    parameterLimit: 50000,
  },
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES!,
};

export const redisOptions = {
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  url: process.env.REDIS_URL,
};

export const postgresOptions = {
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
