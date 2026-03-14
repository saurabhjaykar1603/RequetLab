import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.js';

export const getAllRequests = async () => {
  return await getQuery('SELECT * FROM requests ORDER BY createdAt ASC');
};

export const getRequestsByFolderId = async (folderId) => {
  return await getQuery('SELECT * FROM requests WHERE folderId = ? ORDER BY createdAt ASC', [folderId]);
};

export const getRequestsByCollectionId = async (collectionId) => {
  return await getQuery('SELECT * FROM requests WHERE collectionId = ? AND (folderId IS NULL OR folderId = "") ORDER BY createdAt ASC', [collectionId]);
};

export const getRequestById = async (id) => {
  return await getSingleQuery('SELECT * FROM requests WHERE id = ?', [id]);
};

export const createRequest = async (requestData) => {
  const { name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId } = requestData;
  const id = uuidv4();
  
  const headersStr = headers ? JSON.stringify(headers) : JSON.stringify([]);
  const paramsStr = params ? JSON.stringify(params) : JSON.stringify([]);
  const bodyStr = body ? JSON.stringify(body) : null;
  const authStr = auth ? JSON.stringify(auth) : JSON.stringify({});

  await runQuery(
    `INSERT INTO requests (id, name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, method || 'GET', url || '', headersStr, bodyStr, paramsStr, authStr, preRequestScript || '', testScript || '', folderId || null, collectionId]
  );
  
  return await getRequestById(id);
};

export const updateRequest = async (id, updateData) => {
  const { name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId } = updateData;
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (method !== undefined) { updates.push('method = ?'); values.push(method); }
  if (url !== undefined) { updates.push('url = ?'); values.push(url); }
  if (headers !== undefined) { updates.push('headers = ?'); values.push(JSON.stringify(headers)); }
  if (body !== undefined) { updates.push('body = ?'); values.push(body ? JSON.stringify(body) : null); }
  if (params !== undefined) { updates.push('params = ?'); values.push(JSON.stringify(params)); }
  if (auth !== undefined) { updates.push('auth = ?'); values.push(JSON.stringify(auth)); }
  if (preRequestScript !== undefined) { updates.push('preRequestScript = ?'); values.push(preRequestScript); }
  if (testScript !== undefined) { updates.push('testScript = ?'); values.push(testScript); }
  if (folderId !== undefined) { updates.push('folderId = ?'); values.push(folderId); }
  if (collectionId !== undefined) { updates.push('collectionId = ?'); values.push(collectionId); }
  
  if (updates.length > 0) {
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);
    await runQuery(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`, values);
  }
  
  return await getRequestById(id);
};

export const deleteRequest = async (id) => {
  await runQuery('DELETE FROM requests WHERE id = ?', [id]);
};
