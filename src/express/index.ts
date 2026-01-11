import express from 'express';
import http from 'http';

import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

import { unhandled, errors } from './controllers/index';

import { routerLog, corsUrl, parserOptions } from '../config';
import { cards } from './routers/cards';
import { healthCheck } from './routers/healthCheck';
import { users } from './routers/users';
import { auth } from './routers/auth';
import swaggerDocument from './swagger';
import { games } from './routers/game';
import { notifications } from './routers/notifications';

export const app = express();
export const httpServer = http.createServer(app);

if (routerLog.active) app.use(morgan(routerLog.format));

app.use(cookieParser());

app.use(cors({ origin: corsUrl, optionsSuccessStatus: 200, credentials: true }));

app.use(
  '/open-api',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      withCredentials: true,
    },
  })
);

app.use(express.json(parserOptions.json));
app.use(express.urlencoded(parserOptions.urlencoded));

//Auth
app.use(auth);

// Routing
app.use(users);
app.use(cards);
app.use(games);
app.use(notifications);

// Service healthcheck
app.use(healthCheck);

// Errors handler
app.use(unhandled);
app.use(errors);
