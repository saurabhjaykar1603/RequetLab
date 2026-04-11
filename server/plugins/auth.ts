import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.token;

      if (!token) {
        throw new Error('No token provided');
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      (request as any).user = decoded;
    } catch (err: any) {
      reply.status(401).send({ error: 'Unauthorized: ' + err.message });
    }
  });
});

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: any;
  }
}
