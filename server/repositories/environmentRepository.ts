import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { Environment } from '../interfaces/environment/Environment.ts';
import { logActivity } from './activityRepository';

export const getAllEnvironments = async (workspaceId: string): Promise<Environment[]> => {
  return await getQuery<Environment>('SELECT * FROM environments WHERE "workspaceId" = $1 ORDER BY "createdAt" DESC', [workspaceId]);
};

export const getEnvironmentById = async (id: string): Promise<Environment | undefined> => {
  return await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
};

export const createEnvironment = async (name: string, variables: any, workspaceId: string, userId: string): Promise<Environment | undefined> => {
  const id = uuidv4();
  await runQuery(
    'INSERT INTO environments (id, name, variables, "workspaceId") VALUES ($1, $2, $3, $4)',
    [id, name, variables ? (typeof variables === 'string' ? variables : JSON.stringify(variables)) : JSON.stringify({}), workspaceId]
  );
  const env = await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
  if (env) {
    await logActivity(userId, workspaceId, 'CREATE', 'ENVIRONMENT', id, name);
  }
  return env;
};
export const updateEnvironment = async (id: string, name: string, variables: any, userId: string): Promise<Environment | undefined> => {
  const existing = await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
  await runQuery(
    'UPDATE environments SET name = $1, variables = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $3',
    [name, variables ? (typeof variables === 'string' ? variables : JSON.stringify(variables)) : JSON.stringify({}), id]
  );
  const updated = await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
  if (updated && updated.workspaceId) {
    await logActivity(userId, updated.workspaceId, 'UPDATE', 'ENVIRONMENT', id, name, `Updated variables`);
  }
  return updated;
};

export const deleteEnvironment = async (id: string, userId: string): Promise<void> => {
  const existing = await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
  if (existing && existing.workspaceId) {
    await logActivity(userId, existing.workspaceId, 'DELETE', 'ENVIRONMENT', id, existing.name);
  }
  await runQuery('DELETE FROM environments WHERE id = $1', [id]);
};
