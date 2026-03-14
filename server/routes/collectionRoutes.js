import * as collectionController from '../controllers/collectionController.js';

export default async function (fastify, opts) {
  fastify.get('/', collectionController.getCollections);
  
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          userId: { type: 'string' }
        }
      }
    }
  }, collectionController.createCollection);

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
          name: { type: 'string' }
        }
      }
    }
  }, collectionController.updateCollection);

  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      }
    }
  }, collectionController.deleteCollection);
}
