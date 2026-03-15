import { FastifyReply, FastifyRequest } from 'fastify';
import * as authRepository from '../repositories/authRepository.ts';
import * as collectionRepository from '../repositories/collectionRepository.ts';
import * as importRepository from '../repositories/importRepository.ts';
import * as workspaceRepository from '../repositories/workspaceRepository.ts';

export const getCollections = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const workspaceId = request.headers['x-workspace-id'] as string;
    const collections = await collectionRepository.getAllCollections(workspaceId);
    return collections; 
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const createCollection = async (request: FastifyRequest<{ Body: { name: string; userId?: string } }>, reply: FastifyReply) => {
  try {
    const { name } = request.body;
    const userId = (request as any).user?.id || '';
    const workspaceId = request.headers['x-workspace-id'] as string;
    const newCollection = await collectionRepository.createCollection(name, userId, workspaceId);
    reply.status(201).send(newCollection);
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const importCollection = async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.id || '';
    let workspaceId = request.headers['x-workspace-id'] as string;
    
    // Auto-create workspace if none exist and none is provided
    if (!workspaceId) {
      const userWorkspaces = await workspaceRepository.getUserWorkspaces(userId);
      if (userWorkspaces.length === 0) {
        const user = await authRepository.findUserById(userId);
        const workspaceName = user ? `${user.name}'s Workspace` : 'My Workspace';
        const newWorkspace = await workspaceRepository.createWorkspace(workspaceName, userId, 'personal');
        workspaceId = newWorkspace.id;
      } else {
        // Default to the first workspace if none specified but some exist
        workspaceId = userWorkspaces[0].id;
      }
    }

    const result = await importRepository.importCollectionTree(request.body as any, userId, workspaceId);
    reply.status(201).send({ ...result, workspaceId });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const updateCollection = async (request: FastifyRequest<{ Params: { id: string }; Body: { name: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { name } = request.body;
    const userId = (request as any).user?.id || '';
    const updatedCollection = await collectionRepository.updateCollection(id, name, userId);
    return updatedCollection;
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteCollection = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const userId = (request as any).user?.id || '';
    await collectionRepository.deleteCollection(id, userId);
    return { success: true, id };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
