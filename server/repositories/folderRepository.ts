import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { Folder } from '../interfaces/folder/Folder.ts';

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

export const createFolder = async (name: string, collectionId: string): Promise<Folder | undefined> => {
  const id = uuidv4();
  await runQuery('INSERT INTO folders (id, name, "collectionId") VALUES ($1, $2, $3)', [id, name, collectionId]);
  return await getSingleQuery<Folder>('SELECT * FROM folders WHERE id = $1', [id]);
};

export const updateFolder = async (id: string, name: string): Promise<Folder | undefined> => {
  await runQuery('UPDATE folders SET name = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2', [name, id]);
  return await getSingleQuery<Folder>('SELECT * FROM folders WHERE id = $1', [id]);
};

export const deleteFolder = async (id: string): Promise<void> => {
  await runQuery('DELETE FROM folders WHERE id = $1', [id]);
};
