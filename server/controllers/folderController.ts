import { FastifyRequest, FastifyReply } from 'fastify';
import * as folderRepository from '../repositories/folderRepository.ts';

export const getFolders = async (request: FastifyRequest<{ Querystring: { collectionId?: string } }>, reply: FastifyReply) => {
  try {
    const { collectionId } = request.query;
    const workspaceId = request.headers['x-workspace-id'] as string;
    let folders;
    if (collectionId) {
      folders = await folderRepository.getFoldersByCollectionId(collectionId, workspaceId);
    } else {
      folders = await folderRepository.getAllFolders(workspaceId);
    }
    return folders;
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const createFolder = async (request: FastifyRequest<{ Body: { name: string; collectionId: string } }>, reply: FastifyReply) => {
  try {
    const { name, collectionId } = request.body;
    const newFolder = await folderRepository.createFolder(name, collectionId);
    reply.status(201).send(newFolder);
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const updateFolder = async (request: FastifyRequest<{ Params: { id: string }; Body: { name: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { name } = request.body;
    const updatedFolder = await folderRepository.updateFolder(id, name);
    return updatedFolder;
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteFolder = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    await folderRepository.deleteFolder(id);
    return { success: true, id };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
