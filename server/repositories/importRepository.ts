import { v4 as uuidv4 } from 'uuid';
import { withTransaction } from '../db.ts';
import { RequestEntity } from '../interfaces/request/Request.ts';

interface ImportTree {
  name: string;
  userId?: string;
  folders?: {
    name: string;
    requests?: Partial<RequestEntity>[];
  }[];
  requests?: Partial<RequestEntity>[];
}

export const importCollectionTree = async (tree: ImportTree, userId: string, workspaceId: string) => {
  return await withTransaction(async (client) => {
    const collectionId = uuidv4();
    
    // 1. Insert Collection
    await client.query(
      'INSERT INTO collections (id, name, "userId", "workspaceId") VALUES ($1, $2, $3, $4)',
      [collectionId, tree.name, userId, workspaceId]
    );

    // 2. Insert Root Requests
    if (tree.requests) {
      for (const req of tree.requests) {
        await insertRequest(client, req, collectionId, null);
      }
    }

    // 3. Insert Folders and their Requests
    if (tree.folders) {
      for (const folder of tree.folders) {
        const folderId = uuidv4();
        await client.query(
          'INSERT INTO folders (id, name, "collectionId") VALUES ($1, $2, $3)',
          [folderId, folder.name, collectionId]
        );
        
        if (folder.requests) {
          for (const req of folder.requests) {
            await insertRequest(client, req, collectionId, folderId);
          }
        }
      }
    }

    return { id: collectionId, name: tree.name };
  });
};

async function insertRequest(client: any, req: Partial<RequestEntity>, collectionId: string, folderId: string | null) {
  const id = uuidv4();
  const headersStr = JSON.stringify(req.headers || []);
  const paramsStr = JSON.stringify(req.params || []);
  const bodyStr = req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : null;
  const authStr = JSON.stringify(req.auth || {});

  await client.query(
    `INSERT INTO requests (id, name, method, url, headers, body, params, auth, "preRequestScript", "testScript", "folderId", "collectionId") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id, 
      req.name || 'Untitled Request', 
      req.method || 'GET', 
      req.url || '', 
      headersStr, 
      bodyStr, 
      paramsStr, 
      authStr, 
      req.preRequestScript || '', 
      req.testScript || '', 
      folderId, 
      collectionId
    ]
  );
}
