import { FastifyRequest, FastifyReply } from 'fastify';
import * as workspaceRepository from '../repositories/workspaceRepository.ts';

export const createWorkspace = async (request: FastifyRequest<{ Body: { name: string; type?: 'personal' | 'team' } }>, reply: FastifyReply) => {
  try {
    const { name, type } = request.body;
    const userId = (request as any).user.id; // Will be populated by auth middleware
    const workspace = await workspaceRepository.createWorkspace(name, userId, type);
    return reply.status(201).send(workspace);
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const getUserWorkspaces = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user.id;
    const workspaces = await workspaceRepository.getUserWorkspaces(userId);
    return workspaces;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const getWorkspaceMembers = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const members = await workspaceRepository.getWorkspaceMembers(id);
    return members;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const addMember = async (request: FastifyRequest<{ Params: { id: string }; Body: { userId: string; role?: 'admin' | 'member' } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { userId, role } = request.body;
    await workspaceRepository.addMemberToWorkspace(id, userId, role);
    return { success: true };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const deleteWorkspace = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    await workspaceRepository.deleteWorkspace(id);
    return reply.status(200).send({ success: true });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};
