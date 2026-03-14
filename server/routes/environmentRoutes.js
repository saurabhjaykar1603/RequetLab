import * as environmentController from '../controllers/environmentController.js';

export default async function (fastify, opts) {
  fastify.get('/', environmentController.getEnvironments);

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          variables: { type: 'object' } // Or more restrictive depending on what the UI passes
        }
      }
    }
  }, environmentController.createEnvironment);
}
