import { FastifyInstance } from 'fastify';
import * as activityController from '../controllers/activityController.ts';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [(fastify as any).authenticate] }, activityController.getActivityLogs);
}
