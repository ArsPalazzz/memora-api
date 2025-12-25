import { transports } from 'winston';

import { consoleLog } from '../../config.ts';

const { format, level } = consoleLog;

import { planeConsoleFormatter, jsonConsoleFormatter } from '../services/index.ts';

function setConsoleFormat(format: string) {
  switch (format) {
    case 'plain':
      return planeConsoleFormatter();
    case 'json':
      return jsonConsoleFormatter();
    default:
      return planeConsoleFormatter();
  }
}

export default new transports.Console({
  level,
  format: setConsoleFormat(format),
});
