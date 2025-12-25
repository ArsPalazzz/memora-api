import { createLogger, config } from 'winston';
import { serviceName } from '../config.ts';
import { consoleTransport, lokiTransport } from './transports/index.ts';

const transports = [consoleTransport, lokiTransport];

const logger = createLogger({
  defaultMeta: { service: serviceName },
  levels: config.syslog.levels,
  transports,
});

export default logger;
