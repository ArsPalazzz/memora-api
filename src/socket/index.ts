import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import logger from '../logger';
import { corsUrl } from '../config';
import {
  createPubSubClients,
  isRedisEnabled,
  resolveRedisUrl,
  tryConnectRedis,
} from '../databases/redis/connectRedis';
import duelLobbyCache from '../services/games/duel/DuelLobbyCache';
import { createDuelSocketServer } from './duels/DuelSocketServer';

let io: Server | null = null;

export async function attachSocketServer(httpServer: HttpServer): Promise<Server> {
  io = new Server(httpServer, {
    cors: {
      origin: corsUrl,
      credentials: true,
    },
    path: '/socket.io',
  });

  if (isRedisEnabled()) {
    const redisUrl = resolveRedisUrl()!;
    const pubSubClients = await createPubSubClients(redisUrl);

    if (pubSubClients) {
      io.adapter(createAdapter(pubSubClients.pubClient, pubSubClients.subClient));
      logger.info('Socket.IO Redis adapter enabled');
    } else {
      logger.warn('Socket.IO running without Redis adapter (single instance mode)');
    }

    const redisClient = await tryConnectRedis();
    await duelLobbyCache.init(redisClient);
  } else {
    await duelLobbyCache.init(null);
    logger.info('Socket.IO running without Redis (single instance mode)');
  }

  createDuelSocketServer(io);

  logger.info('Socket.IO duel namespace ready at /duels');

  return io;
}

export async function closeSocketServer(): Promise<void> {
  await duelLobbyCache.close();

  if (io) {
    await io.close();
    io = null;
  }
}

export function getSocketServer(): Server | null {
  return io;
}
