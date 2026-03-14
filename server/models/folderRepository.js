import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.js';

export const getAllFolders = async () => {
  return await getQuery('SELECT * FROM folders ORDER BY createdAt ASC');
};

export const getFoldersByCollectionId = async (collectionId) => {
  return await getQuery('SELECT * FROM folders WHERE collectionId = ? ORDER BY createdAt ASC', [collectionId]);
};

export const createFolder = async (name, collectionId) => {
  const id = uuidv4();
  await runQuery('INSERT INTO folders (id, name, collectionId) VALUES (?, ?, ?)', [id, name, collectionId]);
  return await getSingleQuery('SELECT * FROM folders WHERE id = ?', [id]);
};

export const updateFolder = async (id, name) => {
  await runQuery('UPDATE folders SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [name, id]);
  return await getSingleQuery('SELECT * FROM folders WHERE id = ?', [id]);
};

export const deleteFolder = async (id) => {
  await runQuery('DELETE FROM folders WHERE id = ?', [id]);
};
