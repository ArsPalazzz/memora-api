"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_1 = require("./controllers/index");
const config_1 = require("../config");
const cards_1 = require("./routers/cards");
const healthCheck_1 = require("./routers/healthCheck");
const users_1 = require("./routers/users");
const auth_1 = require("./routers/auth");
const swagger_1 = __importDefault(require("./swagger"));
exports.app = (0, express_1.default)();
exports.app.get('/__ping', (_req, res) => {
    res.status(200).send('pong');
});
// export const httpServer = http.createServer(app);
exports.app.get('/', (_req, res) => {
    res.status(200).send('OK');
});
exports.app.head('/', (_req, res) => {
    res.sendStatus(200);
});
if (config_1.routerLog.active)
    exports.app.use((0, morgan_1.default)(config_1.routerLog.format));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, cors_1.default)({ origin: config_1.corsUrl, optionsSuccessStatus: 200, credentials: true }));
exports.app.use('/open-api', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    swaggerOptions: {
        withCredentials: true,
    },
}));
exports.app.use(express_1.default.json(config_1.parserOptions.json));
exports.app.use(express_1.default.urlencoded(config_1.parserOptions.urlencoded));
//Auth
exports.app.use(auth_1.auth);
// Routing
exports.app.use(users_1.users);
exports.app.use(cards_1.cards);
// Service healthcheck
exports.app.use(healthCheck_1.healthCheck);
// Errors handler
exports.app.use(index_1.unhandled);
exports.app.use(index_1.errors);
