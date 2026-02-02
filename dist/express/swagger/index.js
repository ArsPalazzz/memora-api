"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const config_1 = require("../../config");
const swaggerDocument = js_yaml_1.default.load(fs_1.default.readFileSync(`${__dirname}/swagger.yaml`, 'utf8'));
if (swaggerDocument && swaggerDocument.servers.length) {
    swaggerDocument.servers[0].url = `http://localhost:${config_1.port}`;
}
exports.default = swaggerDocument;
