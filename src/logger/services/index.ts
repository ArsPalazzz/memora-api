import { format } from "winston";
const { combine, timestamp, colorize, printf, json } = format;

const errorStackFormat = format((info) => {
  if (info instanceof Error) {
    return Object.assign({}, info, {
      stack: info.stack,
      message: info.message,
    });
  }
  return info;
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const jsonConsoleFormatter = () =>
  combine(timestamp(), errorStackFormat(), json());

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const planeConsoleFormatter = () =>
  combine(
    timestamp(),
    errorStackFormat(),
    colorize(),
    printf((info) => {
      return `${info.service} @ ${info.timestamp} - ${info.level}: ${
        info.message
      } ${info.stack || ""}`;
    })
  );

export { jsonConsoleFormatter, planeConsoleFormatter };
