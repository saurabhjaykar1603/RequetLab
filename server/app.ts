import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from './logger.ts';
import { initializeDb } from './db.ts';

// Plugins
import envWatcher from './plugins/env-watcher.ts';
import requestLogger from './plugins/request-logger.ts';
import auth from './plugins/auth.ts';
import oauth from './plugins/oauth.ts';

// Routes
import authRoutes from './routes/authRoutes.ts';
import workspaceRoutes from './routes/workspaceRoutes.ts';
import collectionRoutes from './routes/collectionRoutes.ts';
import folderRoutes from './routes/folderRoutes.ts';
import requestRoutes from './routes/requestRoutes.ts';
import environmentRoutes from './routes/environmentRoutes.ts';
import proxyRoutes from './routes/proxyRoutes.ts';
import activityRoutes from './routes/activityRoutes.ts';

dotenv.config({ quiet: process.env.NODE_ENV === 'test' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BuildAppOptions {
  logger?: boolean;
  serveClient?: boolean;
  requestLogging?: boolean;
  watchEnv?: boolean;
}

export const buildApp = (options: BuildAppOptions = {}): FastifyInstance => {
  const loggerEnabled = options.logger ?? true;
  const requestLoggingEnabled = options.requestLogging ?? loggerEnabled;
  const watchEnvEnabled = options.watchEnv ?? process.env.NODE_ENV !== 'test';

  const fastify: FastifyInstance = Fastify({
    logger: loggerEnabled
  });

  // Register Core Plugins
  fastify.register(import('@fastify/cookie'));

  fastify.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true
  });

  if (options.serveClient ?? true) {
    fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../client/dist'),
      prefix: '/',
    });
  }

  // Register Custom Plugins
  if (watchEnvEnabled) {
    fastify.register(envWatcher);
  }

  if (requestLoggingEnabled) {
    fastify.register(requestLogger);
  }

  fastify.register(auth);
  fastify.register(oauth);

  // Register Routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(workspaceRoutes, { prefix: '/api/workspaces' });
  fastify.register(collectionRoutes, { prefix: '/api/collections' });
  fastify.register(folderRoutes, { prefix: '/api/folders' });
  fastify.register(requestRoutes, { prefix: '/api/requests' });
  fastify.register(environmentRoutes, { prefix: '/api/environments' });
  fastify.register(proxyRoutes, { prefix: '/api/proxy' });
  fastify.register(activityRoutes, { prefix: '/api/activity' });

  // Catch-all route to serve React's index.html for SPA routing
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api')) {
      reply.code(404).send({ error: 'Not Found' });
      return;
    }

    if (options.serveClient ?? true) {
      reply.sendFile('index.html');
      return;
    }

    reply.code(404).send({ error: 'Not Found' });
  });

  return fastify;
};

export const startServer = async () => {
  try {
    await initializeDb();

    const fastify = buildApp();
    const PORT = parseInt(process.env.PORT || '5000', 10);
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`Server running on port ${PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
