import { FastifyRequest, FastifyReply } from 'fastify';
import * as collectionRepository from '../repositories/collectionRepository.ts';
import { Collection } from '../interfaces/collection/Collection.ts';

export const getCollections = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const collections = await collectionRepository.getAllCollections();
    return collections; 
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const createCollection = async (request: FastifyRequest<{ Body: { name: string; userId?: string } }>, reply: FastifyReply) => {
  try {
    const { name, userId } = request.body;
    const newCollection = await collectionRepository.createCollection(name, userId);
    reply.status(201).send(newCollection);
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const updateCollection = async (request: FastifyRequest<{ Params: { id: string }; Body: { name: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { name } = request.body;
    const updatedCollection = await collectionRepository.updateCollection(id, name);
    return updatedCollection;
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteCollection = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    await collectionRepository.deleteCollection(id);
    return { success: true, id };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
