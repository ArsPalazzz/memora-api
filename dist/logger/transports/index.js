"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lokiTransport = exports.consoleTransport = void 0;
const ConsoleTransport_1 = __importDefault(require("./ConsoleTransport"));
exports.consoleTransport = ConsoleTransport_1.default;
const LokiTransport_1 = __importDefault(require("./LokiTransport"));
exports.lokiTransport = LokiTransport_1.default;
