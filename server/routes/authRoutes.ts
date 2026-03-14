import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/authController.ts';

export default async function (fastify: FastifyInstance) {
  fastify.post('/signup', authController.signup);
  fastify.post('/login', authController.login);
  fastify.post('/logout', { preHandler: [(fastify as any).authenticate] }, authController.logout);
}
