import { FastifyInstance } from 'fastify';
import * as organizationController from '../controllers/organizationController.ts';

export default async function (fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/', organizationController.createOrganization);
  fastify.get('/', organizationController.getUserOrganizations);
  fastify.get('/:id/members', organizationController.getOrganizationMembers);
  fastify.post('/:id/members', organizationController.addOrganizationMember);
  fastify.patch('/:id/plan', organizationController.updateOrganizationPlan);
}
