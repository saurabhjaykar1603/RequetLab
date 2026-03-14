import * as folderController from '../controllers/folderController.js';

export default async function (fastify, opts) {
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          collectionId: { type: 'string' }
        }
      }
    }
  }, folderController.getFolders);

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'collectionId'],
        properties: {
          name: { type: 'string' },
          collectionId: { type: 'string' }
        }
      }
    }
  }, folderController.createFolder);

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
  }, folderController.updateFolder);

  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      }
    }
  }, folderController.deleteFolder);
}
