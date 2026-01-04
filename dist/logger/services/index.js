"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planeConsoleFormatter = exports.jsonConsoleFormatter = void 0;
const winston_1 = require("winston");
const { combine, timestamp, colorize, printf, json } = winston_1.format;
const errorStackFormat = (0, winston_1.format)((info) => {
    if (info instanceof Error) {
        return Object.assign({}, info, {
            stack: info.stack,
            message: info.message,
        });
    }
    return info;
});
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const jsonConsoleFormatter = () => combine(timestamp(), errorStackFormat(), json());
exports.jsonConsoleFormatter = jsonConsoleFormatter;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const planeConsoleFormatter = () => combine(timestamp(), errorStackFormat(), colorize(), printf((info) => {
    return `${info.service} @ ${info.timestamp} - ${info.level}: ${info.message} ${info.stack || ""}`;
}));
exports.planeConsoleFormatter = planeConsoleFormatter;
