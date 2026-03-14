import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as requestController from '../controllers/requestController.ts';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          collectionId: { type: 'string' },
          folderId: { type: 'string' }
        }
      }
    }
  }, requestController.getRequests);

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'url'],
        properties: {
          name: { type: 'string' },
          method: { type: 'string' },
          url: { type: 'string' },
          headers: { type: 'array' },
          body: { type: 'object', nullable: true },
          params: { type: 'array' },
          auth: { type: 'object' },
          preRequestScript: { type: 'string' },
          testScript: { type: 'string' },
          folderId: { type: 'string', nullable: true },
          collectionId: { type: 'string', nullable: true }
        }
      }
    }
  }, requestController.createRequest);

  fastify.put('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          method: { type: 'string' },
          url: { type: 'string' },
          headers: { type: 'array' },
          body: { type: 'object', nullable: true },
          params: { type: 'array' },
          auth: { type: 'object' },
          preRequestScript: { type: 'string' },
          testScript: { type: 'string' },
          folderId: { type: 'string', nullable: true },
          collectionId: { type: 'string', nullable: true }
        }
      }
    }
  }, requestController.updateRequest);

  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      }
    }
  }, requestController.deleteRequest);
}
