"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const express_1 = require("express");
const healthCheckCtr_1 = require("../controllers/healthCheck/healthCheckCtr");
const healthCheck = (0, express_1.Router)();
exports.healthCheck = healthCheck;
healthCheck.get('/health', healthCheckCtr_1.getHealthCtr);
healthCheck.use('/v3/api-docs', healthCheckCtr_1.sendSwaggerDocCtr);
