import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from './logger.ts';

// Plugins
import envWatcher from './plugins/env-watcher.ts';
import requestLogger from './plugins/request-logger.ts';
import auth from './plugins/auth.ts';

// Routes
import authRoutes from './routes/authRoutes.ts';
import workspaceRoutes from './routes/workspaceRoutes.ts';
import collectionRoutes from './routes/collectionRoutes.ts';
import folderRoutes from './routes/folderRoutes.ts';
import requestRoutes from './routes/requestRoutes.ts';
import environmentRoutes from './routes/environmentRoutes.ts';
import proxyRoutes from './routes/proxyRoutes.ts';
import activityRoutes from './routes/activityRoutes.ts';

dotenv.config();

// Initialize Fastify
const fastify: FastifyInstance = Fastify({
  logger: true 
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Core Plugins
fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
});

// Serve static files from the React app
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../client/dist'),
  prefix: '/', 
});

// Register Custom Plugins
fastify.register(envWatcher);
fastify.register(requestLogger);
fastify.register(auth);

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
  reply.sendFile('index.html');
});

const start = async () => {
  try {
    const PORT = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`Server running on port ${PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
