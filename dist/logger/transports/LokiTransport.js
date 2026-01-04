"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_loki_1 = __importDefault(require("winston-loki"));
exports.default = new winston_loki_1.default({
    labels: { service: "node-postgresql" },
    host: "http://loki:3100",
});
