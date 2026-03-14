import * as proxyController from '../controllers/proxyController.js';

export default async function (fastify, opts) {
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string' },
          method: { type: 'string' },
          headers: { type: 'array' },
          params: { type: 'array' },
          body: { type: 'object', nullable: true },
          _startTime: { type: 'number', nullable: true } // Internal tracking passed by client optionally
        }
      }
    }
  }, proxyController.executeProxy);
}
