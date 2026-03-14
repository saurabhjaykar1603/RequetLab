import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { RequestEntity } from '../interfaces/request/Request.ts';

export const getAllRequests = async (): Promise<RequestEntity[]> => {
  return await getQuery<RequestEntity>('SELECT * FROM requests ORDER BY "createdAt" ASC');
};

export const getRequestsByFolderId = async (folderId: string): Promise<RequestEntity[]> => {
  return await getQuery<RequestEntity>('SELECT * FROM requests WHERE "folderId" = $1 ORDER BY "createdAt" ASC', [folderId]);
};

export const getRequestsByCollectionId = async (collectionId: string): Promise<RequestEntity[]> => {
  return await getQuery<RequestEntity>('SELECT * FROM requests WHERE "collectionId" = $1 AND ("folderId" IS NULL OR "folderId" = \'\') ORDER BY "createdAt" ASC', [collectionId]);
};

export const getRequestById = async (id: string): Promise<RequestEntity | undefined> => {
  return await getSingleQuery<RequestEntity>('SELECT * FROM requests WHERE id = $1', [id]);
};

export const createRequest = async (requestData: Partial<RequestEntity> & { collectionId: string }): Promise<RequestEntity | undefined> => {
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
  
  return await getRequestById(id);
};

export const updateRequest = async (id: string, updateData: Partial<RequestEntity>): Promise<RequestEntity | undefined> => {
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
  
  return await getRequestById(id);
};

export const deleteRequest = async (id: string): Promise<void> => {
  await runQuery('DELETE FROM requests WHERE id = $1', [id]);
};
