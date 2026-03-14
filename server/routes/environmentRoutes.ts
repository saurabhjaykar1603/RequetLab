import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as environmentController from '../controllers/environmentController.ts';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.addHook('preHandler', fastify.authenticate);
  
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

  fastify.put('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      },
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          variables: { type: 'object' }
        }
      }
    }
  }, environmentController.updateEnvironment);

  fastify.delete('/:id', environmentController.deleteEnvironment);
}
