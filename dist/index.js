"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const express_1 = require("./express");
const postgre_1 = __importDefault(require("./databases/postgre"));
const config_1 = require("./config");
const NotificationScheduler_1 = __importDefault(require("./schedule/NotificationScheduler"));
let scheduler = null;
const shutdown = async () => {
    logger_1.default.info(`⚠️ Gracefully shutting down`);
    if (scheduler) {
        try {
            await scheduler.stop();
            logger_1.default.info('🛑 Notification scheduler stopped');
        }
        catch (error) {
            logger_1.default.error('❌ Error stopping notification scheduler:', error);
        }
    }
    express_1.httpServer.close(async () => {
        await postgre_1.default.close();
        logger_1.default.info('👋 All requests stopped, shutting down');
        process.exit();
    });
};
const startServer = async () => {
    try {
        await postgre_1.default.createConnection(config_1.postgresOptions);
        express_1.httpServer
            .listen(config_1.port, '0.0.0.0', () => logger_1.default.info(`🚀 :: ${config_1.serviceName} is running on port :: ${config_1.port}`))
            .on('error', logger_1.default.error);
        try {
            scheduler = new NotificationScheduler_1.default(logger_1.default);
        }
        catch (error) {
            logger_1.default.error('Failed to start notification scheduler:', error);
        }
    }
    catch (err) {
        logger_1.default.error('Failed to connect to Postgres:', err);
        process.exit(1);
    }
};
startServer();
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
