import { getQuery, runQuery } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLog {
  id: string;
  workspaceId?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  createdAt?: string;
  userName?: string;
}

export const logActivity = async (
  userId: string,
  workspaceId: string | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  details?: string
): Promise<void> => {
  const id = uuidv4();
  await runQuery(
    `INSERT INTO activity_logs (id, "workspaceId", "userId", action, "entityType", "entityId", "entityName", details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, workspaceId, userId, action, entityType, entityId, entityName, details]
  );
};

export const getActivityLogs = async (
  workspaceId: string,
  limit: number = 50,
  offset: number = 0,
  filters: { userId?: string; action?: string; entityType?: string } = {}
): Promise<ActivityLog[]> => {
  let query = `
    SELECT al.*, u.name as "userName"
    FROM activity_logs al
    JOIN users u ON al."userId" = u.id
    WHERE al."workspaceId" = $1
  `;
  const params: any[] = [workspaceId];
  let paramIndex = 2;

  if (filters.userId) {
    query += ` AND al."userId" = $${paramIndex++}`;
    params.push(filters.userId);
  }
  if (filters.action) {
    query += ` AND al.action = $${paramIndex++}`;
    params.push(filters.action);
  }
  if (filters.entityType) {
    query += ` AND al."entityType" = $${paramIndex++}`;
    params.push(filters.entityType);
  }

  query += ` ORDER BY al."createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  return await getQuery<ActivityLog>(query, params);
};

export const getActivityLogsCount = async (
  workspaceId: string,
  filters: { userId?: string; action?: string; entityType?: string } = {}
): Promise<number> => {
  let query = `
    SELECT COUNT(*) as count
    FROM activity_logs
    WHERE "workspaceId" = $1
  `;
  const params: any[] = [workspaceId];
  let paramIndex = 2;

  if (filters.userId) {
    query += ` AND "userId" = $${paramIndex++}`;
    params.push(filters.userId);
  }
  if (filters.action) {
    query += ` AND action = $${paramIndex++}`;
    params.push(filters.action);
  }
  if (filters.entityType) {
    query += ` AND "entityType" = $${paramIndex++}`;
    params.push(filters.entityType);
  }

  const result = await getQuery<{ count: string }>(query, params);
  return parseInt(result[0].count, 10);
};
