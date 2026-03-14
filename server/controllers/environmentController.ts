import { FastifyRequest, FastifyReply } from 'fastify';
import * as environmentRepository from '../repositories/environmentRepository.ts';
import * as workspaceRepository from '../repositories/workspaceRepository.ts';
import { Environment } from '../interfaces/environment/Environment.ts';

export const getEnvironments = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const workspaceId = request.headers['x-workspace-id'] as string;
    const userId = (request as any).user.id;

    if (!workspaceId) return reply.status(400).send({ error: 'Workspace ID is required' });

    const role = await workspaceRepository.getMemberRole(workspaceId, userId);
    if (!role) return reply.status(403).send({ error: 'You do not have access to this workspace' });

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
    const userId = (request as any).user.id;

    if (!workspaceId) return reply.status(400).send({ error: 'Workspace ID is required' });

    const role = await workspaceRepository.getMemberRole(workspaceId, userId);
    if (!role) return reply.status(403).send({ error: 'You do not have access to this workspace' });

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
    const userId = (request as any).user.id;

    const targetEnv = await environmentRepository.getEnvironmentById(id);
    if (!targetEnv) return reply.status(404).send({ error: 'Environment not found' });

    const role = await workspaceRepository.getMemberRole(targetEnv.workspaceId, userId);
    if (!role) return reply.status(403).send({ error: 'You do not have access to this environment' });

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
    const userId = (request as any).user.id;

    const targetEnv = await environmentRepository.getEnvironmentById(id);
    if (!targetEnv) return reply.status(404).send({ error: 'Environment not found' });

    const role = await workspaceRepository.getMemberRole(targetEnv.workspaceId, userId);
    if (!role) return reply.status(403).send({ error: 'You do not have access to delete this environment' });

    await environmentRepository.deleteEnvironment(id);
    return { success: true, id };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
