import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { Folder } from '../interfaces/folder/Folder.ts';
import { logActivity } from './activityRepository';
import { Collection } from '../interfaces/collection/Collection.ts';

export const getAllFolders = async (workspaceId?: string): Promise<Folder[]> => {
  if (workspaceId) {
    return await getQuery<Folder>(
      'SELECT f.* FROM folders f JOIN collections c ON f."collectionId" = c.id WHERE c."workspaceId" = $1 ORDER BY f."createdAt" ASC',
      [workspaceId]
    );
  }
  return await getQuery<Folder>('SELECT * FROM folders ORDER BY "createdAt" ASC');
};

export const getFoldersByCollectionId = async (collectionId: string, workspaceId?: string): Promise<Folder[]> => {
  if (workspaceId) {
    return await getQuery<Folder>(
      'SELECT f.* FROM folders f JOIN collections c ON f."collectionId" = c.id WHERE f."collectionId" = $1 AND c."workspaceId" = $2 ORDER BY f."createdAt" ASC',
      [collectionId, workspaceId]
    );
  }
  return await getQuery<Folder>('SELECT * FROM folders WHERE "collectionId" = $1 ORDER BY "createdAt" ASC', [collectionId]);
};

export const createFolder = async (name: string, collectionId: string, userId: string): Promise<Folder | undefined> => {
  const id = uuidv4();
  await runQuery('INSERT INTO folders (id, name, "collectionId") VALUES ($1, $2, $3)', [id, name, collectionId]);
  const folder = await getSingleQuery<Folder>('SELECT * FROM folders WHERE id = $1', [id]);
  const collection = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [collectionId]);
  
  if (folder && collection && collection.workspaceId) {
    await logActivity(userId, collection.workspaceId, 'CREATE', 'FOLDER', id, name);
  }
  return folder;
};

export const updateFolder = async (id: string, name: string, userId: string): Promise<Folder | undefined> => {
  const existing = await getSingleQuery<Folder>('SELECT * FROM folders WHERE id = $1', [id]);
  await runQuery('UPDATE folders SET name = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2', [name, id]);
  const updated = await getSingleQuery<Folder>('SELECT * FROM folders WHERE id = $1', [id]);
  
  if (updated) {
    const collection = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [updated.collectionId]);
    if (collection && collection.workspaceId) {
      await logActivity(userId, collection.workspaceId, 'UPDATE', 'FOLDER', id, name, `Renamed from ${existing?.name} to ${name}`);
    }
  }
  return updated;
};

export const deleteFolder = async (id: string, userId: string): Promise<void> => {
  const existing = await getSingleQuery<Folder>('SELECT * FROM folders WHERE id = $1', [id]);
  if (existing) {
    const collection = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [existing.collectionId]);
    if (collection && collection.workspaceId) {
      await logActivity(userId, collection.workspaceId, 'DELETE', 'FOLDER', id, existing.name);
    }
  }
  await runQuery('DELETE FROM folders WHERE id = $1', [id]);
};
