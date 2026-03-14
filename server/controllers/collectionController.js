import * as collectionRepository from '../repositories/collectionRepository.js';

export const getCollections = async (req, res) => {
  try {
    const collections = await collectionRepository.getAllCollections();
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name, userId } = req.body;
    const newCollection = await collectionRepository.createCollection(name, userId);
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedCollection = await collectionRepository.updateCollection(id, name);
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    await collectionRepository.deleteCollection(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
