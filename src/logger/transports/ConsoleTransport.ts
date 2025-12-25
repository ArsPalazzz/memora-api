import { transports } from 'winston';

import { consoleLog } from '../../config';

const { format, level } = consoleLog;

import { planeConsoleFormatter, jsonConsoleFormatter } from '../services/index';

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
