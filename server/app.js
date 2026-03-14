import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

import collectionRoutes from './routes/collectionRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import environmentRoutes from './routes/environmentRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';

dotenv.config();

// Watch .env file for changes
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.watchFile(envPath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      const result = dotenv.config({ override: true });
      if (result.error) {
        logger.error(`Error reloading .env file: ${result.error.message}`);
      } else {
        logger.info('Reloaded .env file due to changes');
      }
    }
  });
}

// Initialize Fastify
const fastify = Fastify({
  logger: false // we will plug our own custom logger instead
});

// Register Plugins
fastify.register(cors, {
  origin: true, // Allow all origins (for dev)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Explicitly allow DELETE
});

// Request Logging Hook (mimicking standard logger behavior)
fastify.addHook('onRequest', (request, reply, done) => {
  logger.info(`${request.method} ${request.url}`);
  done();
});

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
