"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthCtr = getHealthCtr;
exports.sendSwaggerDocCtr = sendSwaggerDocCtr;
const postgre_1 = __importDefault(require("../../../databases/postgre"));
const swagger_1 = __importDefault(require("../../swagger"));
async function getHealthCtr(req, res, next) {
    try {
        await postgre_1.default.query({ name: 'Ping', text: 'SELECT 1', values: [] });
        res.json({
            status: 'OK',
            postgres: 'connected',
            redis: 'connected',
        });
    }
    catch (e) {
        next(e);
    }
}
async function sendSwaggerDocCtr(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.default);
}
