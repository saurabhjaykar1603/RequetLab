import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { RequestEntity } from '../interfaces/request/Request.ts';
import { logActivity } from './activityRepository';
import { Collection } from '../interfaces/collection/Collection.ts';

export const getAllRequests = async (workspaceId?: string): Promise<RequestEntity[]> => {
  if (workspaceId) {
    return await getQuery<RequestEntity>(
      'SELECT r.* FROM requests r JOIN collections c ON r."collectionId" = c.id WHERE c."workspaceId" = $1 ORDER BY r."createdAt" ASC',
      [workspaceId]
    );
  }
  return await getQuery<RequestEntity>('SELECT * FROM requests ORDER BY "createdAt" ASC');
};

export const getRequestsByFolderId = async (folderId: string, workspaceId?: string): Promise<RequestEntity[]> => {
  if (workspaceId) {
    return await getQuery<RequestEntity>(
      'SELECT r.* FROM requests r JOIN collections c ON r."collectionId" = c.id WHERE r."folderId" = $1 AND c."workspaceId" = $2 ORDER BY r."createdAt" ASC',
      [folderId, workspaceId]
    );
  }
  return await getQuery<RequestEntity>('SELECT * FROM requests WHERE "folderId" = $1 ORDER BY "createdAt" ASC', [folderId]);
};

export const getRequestsByCollectionId = async (collectionId: string, workspaceId?: string): Promise<RequestEntity[]> => {
  if (workspaceId) {
    return await getQuery<RequestEntity>(
      'SELECT r.* FROM requests r JOIN collections c ON r."collectionId" = c.id WHERE r."collectionId" = $1 AND (r."folderId" IS NULL OR r."folderId" = \'\') AND c."workspaceId" = $2 ORDER BY r."createdAt" ASC',
      [collectionId, workspaceId]
    );
  }
  return await getQuery<RequestEntity>('SELECT * FROM requests WHERE "collectionId" = $1 AND ("folderId" IS NULL OR "folderId" = \'\') ORDER BY "createdAt" ASC', [collectionId]);
};

export const getRequestById = async (id: string): Promise<RequestEntity | undefined> => {
  return await getSingleQuery<RequestEntity>('SELECT * FROM requests WHERE id = $1', [id]);
};

export const createRequest = async (requestData: Partial<RequestEntity> & { collectionId: string }, userId: string): Promise<RequestEntity | undefined> => {
  const { name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId } = requestData;
  const id = uuidv4();
  
  const headersStr = headers ? (typeof headers === 'string' ? headers : JSON.stringify(headers)) : JSON.stringify([]);
  const paramsStr = params ? (typeof params === 'string' ? params : JSON.stringify(params)) : JSON.stringify([]);
  const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
  const authStr = auth ? (typeof auth === 'string' ? auth : JSON.stringify(auth)) : JSON.stringify({});

  await runQuery(
    `INSERT INTO requests (id, name, method, url, headers, body, params, auth, "preRequestScript", "testScript", "folderId", "collectionId") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, name, method || 'GET', url || '', headersStr, bodyStr, paramsStr, authStr, preRequestScript || '', testScript || '', folderId || null, collectionId]
  );
  
  const request = await getRequestById(id);
  const collection = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [collectionId]);
  
  if (request && collection && collection.workspaceId) {
    await logActivity(userId, collection.workspaceId, 'CREATE', 'REQUEST', id, name);
  }
  
  return request;
};

export const updateRequest = async (id: string, updateData: Partial<RequestEntity>, userId: string): Promise<RequestEntity | undefined> => {
  const existing = await getRequestById(id);
  const { name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId } = updateData;
  
  const updates: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;
  
  if (name !== undefined) { updates.push(`name = $${paramIdx++}`); values.push(name); }
  if (method !== undefined) { updates.push(`method = $${paramIdx++}`); values.push(method); }
  if (url !== undefined) { updates.push(`url = $${paramIdx++}`); values.push(url); }
  if (headers !== undefined) { updates.push(`headers = $${paramIdx++}`); values.push(typeof headers === 'string' ? headers : JSON.stringify(headers)); }
  if (body !== undefined) { updates.push(`body = $${paramIdx++}`); values.push(body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null); }
  if (params !== undefined) { updates.push(`params = $${paramIdx++}`); values.push(typeof params === 'string' ? params : JSON.stringify(params)); }
  if (auth !== undefined) { updates.push(`auth = $${paramIdx++}`); values.push(typeof auth === 'string' ? auth : JSON.stringify(auth)); }
  if (preRequestScript !== undefined) { updates.push(`"preRequestScript" = $${paramIdx++}`); values.push(preRequestScript); }
  if (testScript !== undefined) { updates.push(`"testScript" = $${paramIdx++}`); values.push(testScript); }
  if (folderId !== undefined) { updates.push(`"folderId" = $${paramIdx++}`); values.push(folderId); }
  if (collectionId !== undefined) { updates.push(`"collectionId" = $${paramIdx++}`); values.push(collectionId); }
  
  if (updates.length > 0) {
    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    values.push(id);
    await runQuery(`UPDATE requests SET ${updates.join(', ')} WHERE id = $${paramIdx}`, values);
  }
  
  const updated = await getRequestById(id);
  if (updated) {
    const collection = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [updated.collectionId]);
    if (collection && collection.workspaceId) {
      await logActivity(userId, collection.workspaceId, 'UPDATE', 'REQUEST', id, updated.name, `Updated request configuration`);
    }
  }
  
  return updated;
};

export const deleteRequest = async (id: string, userId: string): Promise<void> => {
  const existing = await getRequestById(id);
  if (existing) {
    const collection = await getSingleQuery<Collection>('SELECT * FROM collections WHERE id = $1', [existing.collectionId]);
    if (collection && collection.workspaceId) {
      await logActivity(userId, collection.workspaceId, 'DELETE', 'REQUEST', id, existing.name);
    }
  }
  await runQuery('DELETE FROM requests WHERE id = $1', [id]);
};
