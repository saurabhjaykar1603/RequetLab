import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.js';

export const getAllCollections = async () => {
  return await getQuery('SELECT * FROM collections ORDER BY createdAt DESC');
};

export const createCollection = async (name, userId) => {
  const id = uuidv4();
  await runQuery('INSERT INTO collections (id, name, userId) VALUES (?, ?, ?)', [id, name, userId || '']);
  return await getSingleQuery('SELECT * FROM collections WHERE id = ?', [id]);
};

export const updateCollection = async (id, name) => {
  await runQuery('UPDATE collections SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [name, id]);
  return await getSingleQuery('SELECT * FROM collections WHERE id = ?', [id]);
};

export const deleteCollection = async (id) => {
  await runQuery('DELETE FROM collections WHERE id = ?', [id]);
};
