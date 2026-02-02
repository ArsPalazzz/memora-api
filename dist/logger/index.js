"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const config_1 = require("../config");
const index_1 = require("./transports/index");
const transports = [index_1.consoleTransport, index_1.lokiTransport];
const logger = (0, winston_1.createLogger)({
    defaultMeta: { service: config_1.serviceName },
    levels: winston_1.config.syslog.levels,
    transports,
});
exports.default = logger;
