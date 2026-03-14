import * as folderRepository from '../repositories/folderRepository.js';

export const getFolders = async (req, res) => {
  try {
    const { collectionId } = req.query;
    let folders;
    if (collectionId) {
      folders = await folderRepository.getFoldersByCollectionId(collectionId);
    } else {
      folders = await folderRepository.getAllFolders();
    }
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { name, collectionId } = req.body;
    const newFolder = await folderRepository.createFolder(name, collectionId);
    res.status(201).json(newFolder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedFolder = await folderRepository.updateFolder(id, name);
    res.json(updatedFolder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    await folderRepository.deleteFolder(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
