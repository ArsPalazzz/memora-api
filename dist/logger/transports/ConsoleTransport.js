"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const config_1 = require("../../config");
const { format, level } = config_1.consoleLog;
const index_1 = require("../services/index");
function setConsoleFormat(format) {
    switch (format) {
        case 'plain':
            return (0, index_1.planeConsoleFormatter)();
        case 'json':
            return (0, index_1.jsonConsoleFormatter)();
        default:
            return (0, index_1.planeConsoleFormatter)();
    }
}
exports.default = new winston_1.transports.Console({
    level,
    format: setConsoleFormat(format),
});
