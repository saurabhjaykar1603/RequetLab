import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import logger from '../logger.ts';

const envWatcherPlugin: FastifyPluginAsync = async (fastify, opts) => {
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

    fastify.addHook('onClose', (instance, done) => {
      fs.unwatchFile(envPath);
      done();
    });
  }
};

export default fp(envWatcherPlugin);
