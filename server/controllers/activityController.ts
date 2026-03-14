import { FastifyRequest, FastifyReply } from 'fastify';
import * as activityRepository from '../repositories/activityRepository.ts';
import * as workspaceRepository from '../repositories/workspaceRepository.ts';

export const getActivityLogs = async (
  request: FastifyRequest<{ 
    Querystring: { 
      limit?: string; 
      offset?: string; 
      userId?: string; 
      action?: string; 
      entityType?: string 
    } 
  }>, 
  reply: FastifyReply
) => {
  try {
    const workspaceId = request.headers['x-workspace-id'] as string;
    const userId = (request as any).user.id;

    if (!workspaceId) {
      return reply.status(400).send({ error: 'Workspace ID is required' });
    }

    const role = await workspaceRepository.getMemberRole(workspaceId, userId);
    if (!role) {
      return reply.status(403).send({ error: 'You do not have access to this workspace' });
    }

    const limit = parseInt(request.query.limit || '50', 10);
    const offset = parseInt(request.query.offset || '0', 10);
    const filters = {
      userId: request.query.userId,
      action: request.query.action,
      entityType: request.query.entityType,
    };

    const logs = await activityRepository.getActivityLogs(workspaceId, limit, offset, filters);
    const total = await activityRepository.getActivityLogsCount(workspaceId, filters);

    return { logs, total, limit, offset };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
