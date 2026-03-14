import * as requestController from '../controllers/requestController.js';

export default async function (fastify, opts) {
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
          body: { type: 'object', nullable: true }, // Fastify allows nullable
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
      // Not making required here since it's an update (PATCH-like)
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
