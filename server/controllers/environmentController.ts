import { FastifyRequest, FastifyReply } from 'fastify';
import * as environmentRepository from '../repositories/environmentRepository.ts';
import { Environment } from '../interfaces/environment/Environment.ts';

export const getEnvironments = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const environments = await environmentRepository.getAllEnvironments();
    return environments.map(e => ({
      ...e,
      variables: e.variables ? JSON.parse(e.variables) : {}
    }));
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const createEnvironment = async (request: FastifyRequest<{ Body: { name: string; variables: any } }>, reply: FastifyReply) => {
  try {
    const { name, variables } = request.body;
    const newEnv = await environmentRepository.createEnvironment(name, variables);
    if (newEnv) {
      newEnv.variables = JSON.parse(newEnv.variables);
    }
    reply.status(201).send(newEnv);
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
