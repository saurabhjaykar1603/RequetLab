import { FastifyRequest, FastifyReply } from 'fastify';
import * as collectionRepository from '../repositories/collectionRepository.ts';
import * as importRepository from '../repositories/importRepository.ts';
import { Collection } from '../interfaces/collection/Collection.ts';

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
    const workspaceId = request.headers['x-workspace-id'] as string;
    const result = await importRepository.importCollectionTree(request.body as any, userId, workspaceId);
    reply.status(201).send(result);
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
