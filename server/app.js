import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import logger from './logger.js';

// Plugins
import envWatcher from './plugins/env-watcher.js';
import requestLogger from './plugins/request-logger.js';

// Routes
import collectionRoutes from './routes/collectionRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import environmentRoutes from './routes/environmentRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';

dotenv.config();

// Initialize Fastify
const fastify = Fastify({
  logger: false 
});

// Register Core Plugins
fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
});

// Register Custom Plugins
fastify.register(envWatcher);
fastify.register(requestLogger);

// Register Routes
fastify.register(collectionRoutes, { prefix: '/api/collections' });
fastify.register(folderRoutes, { prefix: '/api/folders' });
fastify.register(requestRoutes, { prefix: '/api/requests' });
fastify.register(environmentRoutes, { prefix: '/api/environments' });
fastify.register(proxyRoutes, { prefix: '/api/proxy' });

const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`Server running on port ${PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
