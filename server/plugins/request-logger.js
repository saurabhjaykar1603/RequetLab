import fp from 'fastify-plugin';
import logger from '../logger.js';

async function requestLoggerPlugin(fastify, opts) {
  fastify.addHook('onRequest', (request, reply, done) => {
    logger.info(`${request.method} ${request.url}`);
    done();
  });
}

export default fp(requestLoggerPlugin);
