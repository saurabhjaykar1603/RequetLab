import * as folderRepository from '../repositories/folderRepository.js';

export const getFolders = async (request, reply) => {
  try {
    const { collectionId } = request.query || {};
    let folders;
    if (collectionId) {
      folders = await folderRepository.getFoldersByCollectionId(collectionId);
    } else {
      folders = await folderRepository.getAllFolders();
    }
    return folders;
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const createFolder = async (request, reply) => {
  try {
    const { name, collectionId } = request.body;
    const newFolder = await folderRepository.createFolder(name, collectionId);
    reply.status(201).send(newFolder);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const updateFolder = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name } = request.body;
    const updatedFolder = await folderRepository.updateFolder(id, name);
    return updatedFolder;
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteFolder = async (request, reply) => {
  try {
    const { id } = request.params;
    await folderRepository.deleteFolder(id);
    return { success: true, id };
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};
