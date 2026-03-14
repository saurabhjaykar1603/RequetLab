import { v4 as uuidv4 } from 'uuid';
import { getQuery, getSingleQuery, runQuery } from '../db.ts';
import { Workspace } from '../interfaces/workspace/Workspace.ts';

export const createWorkspace = async (name: string, ownerId: string, type: 'personal' | 'team' = 'personal'): Promise<Workspace> => {
  const id = uuidv4();
  const sql = 'INSERT INTO workspaces (id, name, "ownerId", type) VALUES ($1, $2, $3, $4) RETURNING *';
  const res = await runQuery(sql, [id, name, ownerId, type]);
  
  // Also add owner as member
  await addMemberToWorkspace(id, ownerId, 'admin');
  
  return res.rows[0];
};

export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  const sql = `
    SELECT w.* FROM workspaces w
    JOIN workspace_members wm ON w.id = wm."workspaceId"
    WHERE wm."userId" = $1
  `;
  return await getQuery<Workspace>(sql, [userId]);
};

export const findWorkspaceById = async (id: string): Promise<Workspace | undefined> => {
  const sql = 'SELECT * FROM workspaces WHERE id = $1';
  return await getSingleQuery<Workspace>(sql, [id]);
};

export const deleteWorkspace = async (id: string) => {
  // SQLite doesn't always have FK cascade enabled, so we might need to delete members manually
  // or rely on the schema if it's set up correctly. Let's delete members first to be safe.
  await runQuery('DELETE FROM workspace_members WHERE "workspaceId" = $1', [id]);
  const sql = 'DELETE FROM workspaces WHERE id = $1';
  await runQuery(sql, [id]);
};

export const addMemberToWorkspace = async (workspaceId: string, userId: string, role: 'admin' | 'member' = 'member') => {
  const sql = 'INSERT INTO workspace_members ("workspaceId", "userId", role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING';
  await runQuery(sql, [workspaceId, userId, role]);
};

export const getWorkspaceMembers = async (workspaceId: string) => {
  const sql = `
    SELECT u.id, u.name, u.email, wm.role FROM users u
    JOIN workspace_members wm ON u.id = wm."userId"
    WHERE wm."workspaceId" = $1
  `;
  return await getQuery<any>(sql, [workspaceId]);
};

export const getMemberRole = async (workspaceId: string, userId: string): Promise<string | undefined> => {
  const sql = 'SELECT role FROM workspace_members WHERE "workspaceId" = $1 AND "userId" = $2';
  const res = await getSingleQuery<{ role: string }>(sql, [workspaceId, userId]);
  return res?.role;
};

export const removeMemberFromWorkspace = async (workspaceId: string, userId: string) => {
  const sql = 'DELETE FROM workspace_members WHERE "workspaceId" = $1 AND "userId" = $2';
  await runQuery(sql, [workspaceId, userId]);
};
