import { FastifyRequest, FastifyReply } from 'fastify';
import * as environmentRepository from '../repositories/environmentRepository.ts';
import { Environment } from '../interfaces/environment/Environment.ts';

export const getEnvironments = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const workspaceId = request.headers['x-workspace-id'] as string;
    const environments = await environmentRepository.getAllEnvironments(workspaceId);
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
    const workspaceId = request.headers['x-workspace-id'] as string;
    const newEnv = await environmentRepository.createEnvironment(name, variables, workspaceId);
    if (newEnv) {
      newEnv.variables = JSON.parse(newEnv.variables);
    }
    reply.status(201).send(newEnv);
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
export const updateEnvironment = async (request: FastifyRequest<{ Params: { id: string }; Body: { name: string; variables: any } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { name, variables } = request.body;
    const updatedEnv = await environmentRepository.updateEnvironment(id, name, variables);
    if (updatedEnv) {
      updatedEnv.variables = JSON.parse(updatedEnv.variables);
    }
    return updatedEnv;
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteEnvironment = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    await environmentRepository.deleteEnvironment(id);
    return { success: true, id };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
