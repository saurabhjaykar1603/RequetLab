import * as collectionRepository from '../models/collectionRepository.js';

export const getCollections = async (request, reply) => {
  try {
    const collections = await collectionRepository.getAllCollections();
    return collections; // Fastify automatically strings to JSON and sends 200
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const createCollection = async (request, reply) => {
  try {
    const { name, userId } = request.body;
    const newCollection = await collectionRepository.createCollection(name, userId);
    reply.status(201).send(newCollection);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const updateCollection = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name } = request.body;
    const updatedCollection = await collectionRepository.updateCollection(id, name);
    return updatedCollection;
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteCollection = async (request, reply) => {
  try {
    const { id } = request.params;
    await collectionRepository.deleteCollection(id);
    return { success: true, id };
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};
