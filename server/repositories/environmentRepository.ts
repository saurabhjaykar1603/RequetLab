import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { Environment } from '../interfaces/environment/Environment.ts';

export const getAllEnvironments = async (workspaceId?: string): Promise<Environment[]> => {
  if (workspaceId) {
    return await getQuery<Environment>('SELECT * FROM environments WHERE "workspaceId" = $1 ORDER BY "createdAt" DESC', [workspaceId]);
  }
  return await getQuery<Environment>('SELECT * FROM environments ORDER BY "createdAt" DESC');
};

export const createEnvironment = async (name: string, variables: any, workspaceId: string): Promise<Environment | undefined> => {
  const id = uuidv4();
  await runQuery(
    'INSERT INTO environments (id, name, variables, "workspaceId") VALUES ($1, $2, $3, $4)',
    [id, name, variables ? (typeof variables === 'string' ? variables : JSON.stringify(variables)) : JSON.stringify({}), workspaceId]
  );
  return await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
};
export const updateEnvironment = async (id: string, name: string, variables: any): Promise<Environment | undefined> => {
  await runQuery(
    'UPDATE environments SET name = $1, variables = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $3',
    [name, variables ? (typeof variables === 'string' ? variables : JSON.stringify(variables)) : JSON.stringify({}), id]
  );
  return await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
};

export const deleteEnvironment = async (id: string): Promise<void> => {
  await runQuery('DELETE FROM environments WHERE id = $1', [id]);
};
