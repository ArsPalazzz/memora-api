"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unhandled = unhandled;
exports.errors = errors;
const http_errors_1 = __importDefault(require("http-errors"));
const logger_1 = __importDefault(require("../../logger"));
const config_1 = require("../../config");
function unhandled(req, res, next) {
    return next(http_errors_1.default.NotFound);
}
function errors(error, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    console.log(error);
    if (!error.status) {
        logger_1.default.error('Internal Server Error', error.message);
    }
    else {
        logger_1.default.info(`Handled error [${error.status}] :: ${error.message}`);
    }
    const userErrorResponse = {
        status: error.status || 500,
        message: error.message || 'Internal Server Error',
    };
    if (config_1.environment === 'development' && error.errors?.length) {
        userErrorResponse.errors = error.errors;
    }
    res.status(error.status || 500);
    res.json(userErrorResponse);
}
