import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { Collection } from '../interfaces/collection/Collection.ts';

export const getAllCollections = async (): Promise<Collection[]> => {
  return await getQuery<Collection>('SELECT * FROM collections ORDER BY "createdAt" DESC');
};

export const createCollection = async (name: string, userId: string = ''): Promise<Collection | undefined> => {
  const id = uuidv4();
  await runQuery('INSERT INTO collections (id, name, "userId") VALUES ($1, $2, $3)', [id, name, userId]);
  return await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [id]);
};

export const updateCollection = async (id: string, name: string): Promise<Collection | undefined> => {
  await runQuery('UPDATE collections SET name = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2', [name, id]);
  return await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [id]);
};

export const deleteCollection = async (id: string): Promise<void> => {
  await runQuery('DELETE FROM collections WHERE id = $1', [id]);
};
