import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as environmentController from '../controllers/environmentController.ts';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.get('/', environmentController.getEnvironments);

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          variables: { type: 'object' }
        }
      }
    }
  }, environmentController.createEnvironment);
}
