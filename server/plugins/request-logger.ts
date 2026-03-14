import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import logger from '../logger.ts';

const requestLoggerPlugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.addHook('onRequest', (request, reply, done) => {
    logger.info(`${request.method} ${request.url}`);
    done();
  });
};

export default fp(requestLoggerPlugin);
