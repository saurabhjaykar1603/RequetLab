import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { Collection } from '../interfaces/collection/Collection.ts';
import { logActivity } from './activityRepository';

export const getAllCollections = async (workspaceId?: string): Promise<Collection[]> => {
  if (workspaceId) {
    return await getQuery<Collection>('SELECT * FROM collections WHERE "workspaceId" = $1 ORDER BY "createdAt" DESC', [workspaceId]);
  }
  return await getQuery<Collection>('SELECT * FROM collections ORDER BY "createdAt" DESC');
};

export const createCollection = async (name: string, userId: string = '', workspaceId?: string): Promise<Collection | undefined> => {
  const id = uuidv4();
  await runQuery('INSERT INTO collections (id, name, "userId", "workspaceId") VALUES ($1, $2, $3, $4)', [id, name, userId, workspaceId]);
  const collection = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [id]);
  if (collection && workspaceId) {
    await logActivity(userId, workspaceId, 'CREATE', 'COLLECTION', id, name);
  }
  return collection;
};

export const updateCollection = async (id: string, name: string, userId: string): Promise<Collection | undefined> => {
  const existing = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [id]);
  await runQuery('UPDATE collections SET name = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2', [name, id]);
  const updated = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [id]);
  if (updated && updated.workspaceId) {
    await logActivity(userId, updated.workspaceId, 'UPDATE', 'COLLECTION', id, name, `Renamed from ${existing?.name} to ${name}`);
  }
  return updated;
};

export const deleteCollection = async (id: string, userId: string): Promise<void> => {
  const existing = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [id]);
  if (existing && existing.workspaceId) {
    await logActivity(userId, existing.workspaceId, 'DELETE', 'COLLECTION', id, existing.name);
  }
  await runQuery('DELETE FROM collections WHERE id = $1', [id]);
};
