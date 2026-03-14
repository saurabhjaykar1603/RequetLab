import { FastifyInstance } from 'fastify';
import * as workspaceController from '../controllers/workspaceController.ts';

export default async function (fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/', workspaceController.createWorkspace);
  fastify.get('/', workspaceController.getUserWorkspaces);
  fastify.get('/:id/members', workspaceController.getWorkspaceMembers);
  fastify.post('/:id/members', workspaceController.addMember);
  fastify.delete('/:id/members/:userId', workspaceController.removeMember);
  fastify.delete('/:id', workspaceController.deleteWorkspace);
}
