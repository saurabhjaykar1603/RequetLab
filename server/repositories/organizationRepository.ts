import { v4 as uuidv4 } from 'uuid';
import { getQuery, getSingleQuery, runQuery } from '../db.ts';
import { Organization, OrganizationPlan, ORGANIZATION_PLAN_LIMITS } from '../interfaces/organization/Organization.ts';
import { logActivity } from './activityRepository.ts';

export const createOrganization = async (
  name: string,
  ownerId: string,
  plan: OrganizationPlan = 'free'
): Promise<Organization> => {
  const id = uuidv4();
  const sql = 'INSERT INTO organizations (id, name, "ownerId", plan) VALUES ($1, $2, $3, $4) RETURNING *';
  const result = await runQuery(sql, [id, name, ownerId, plan]);

  await addMemberToOrganization(id, ownerId, 'admin');
  await logActivity(ownerId, undefined, 'CREATE', 'ORGANIZATION', id, name, `Organization '${name}' created on ${plan} plan`);

  return result.rows[0] as Organization;
};

export const findOrganizationById = async (id: string): Promise<Organization | undefined> => {
  const sql = 'SELECT * FROM organizations WHERE id = $1';
  return await getSingleQuery<Organization>(sql, [id]);
};

export const findOrganizationByOwnerId = async (ownerId: string): Promise<Organization | undefined> => {
  const sql = 'SELECT * FROM organizations WHERE "ownerId" = $1 ORDER BY "createdAt" DESC LIMIT 1';
  return await getSingleQuery<Organization>(sql, [ownerId]);
};

export const getOrganizationsByOwnerId = async (ownerId: string): Promise<Organization[]> => {
  const sql = 'SELECT * FROM organizations WHERE "ownerId" = $1 ORDER BY "createdAt" DESC';
  return await getQuery<Organization>(sql, [ownerId]);
};

export const getUserOrganizations = async (userId: string): Promise<Array<Organization & { role: string; memberCount: number }>> => {
  const sql = `
    SELECT o.*, om.role, COUNT(all_members."userId")::int AS "memberCount"
    FROM organizations o
    JOIN organization_members om ON o.id = om."organizationId"
    LEFT JOIN organization_members all_members ON o.id = all_members."organizationId"
    WHERE om."userId" = $1
    GROUP BY o.id, om.role
    ORDER BY o."createdAt" DESC
  `;

  return await getQuery<Array<Organization & { role: string; memberCount: number }>[number]>(sql, [userId]);
};

export const getOrganizationMembers = async (organizationId: string): Promise<any[]> => {
  const sql = `
    SELECT u.id,
           u.name,
           u.email,
           u."avatarUrl",
           u."jobTitle",
           u.company,
           om.role
    FROM users u
    JOIN organization_members om ON u.id = om."userId"
    WHERE om."organizationId" = $1
    ORDER BY om.role DESC, u.name ASC
  `;

  return await getQuery<any>(sql, [organizationId]);
};

export const getOrganizationMemberRole = async (
  organizationId: string,
  userId: string
): Promise<'admin' | 'member' | undefined> => {
  const sql = 'SELECT role FROM organization_members WHERE "organizationId" = $1 AND "userId" = $2';
  const result = await getSingleQuery<{ role: 'admin' | 'member' }>(sql, [organizationId, userId]);
  return result?.role;
};

export const countOrganizationMembers = async (organizationId: string): Promise<number> => {
  const sql = 'SELECT COUNT(*)::int AS count FROM organization_members WHERE "organizationId" = $1';
  const result = await getSingleQuery<{ count: number }>(sql, [organizationId]);
  return result?.count ?? 0;
};

export const addMemberToOrganization = async (
  organizationId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> => {
  const sql = `
    INSERT INTO organization_members ("organizationId", "userId", role)
    VALUES ($1, $2, $3)
    ON CONFLICT ("organizationId", "userId") DO NOTHING
  `;
  await runQuery(sql, [organizationId, userId, role]);
};

export const updateOrganizationPlan = async (
  organizationId: string,
  plan: OrganizationPlan,
  actorId: string
): Promise<Organization | undefined> => {
  const sql = `
    UPDATE organizations
    SET plan = $2,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const result = await runQuery(sql, [organizationId, plan]);
  const updated = result.rows[0] as Organization | undefined;

  if (updated) {
    await logActivity(actorId, undefined, 'UPDATE', 'ORGANIZATION', organizationId, updated.name, `Organization moved to ${plan} plan`);
  }

  return updated;
};

export const cleanupExtraOrganizationsForOwner = async (
  ownerId: string
): Promise<{ keptOrganizationId?: string; deletedOrganizationIds: string[] }> => {
  const ownedOrganizations = await getOrganizationsByOwnerId(ownerId);
  if (ownedOrganizations.length <= 1) {
    return {
      keptOrganizationId: ownedOrganizations[0]?.id,
      deletedOrganizationIds: [],
    };
  }

  const [organizationToKeep, ...organizationsToDelete] = ownedOrganizations;
  const deletedOrganizationIds: string[] = [];

  for (const organization of organizationsToDelete) {
    await runQuery('DELETE FROM organizations WHERE id = $1', [organization.id]);
    deletedOrganizationIds.push(organization.id);
    await logActivity(
      ownerId,
      undefined,
      'DELETE',
      'ORGANIZATION',
      organization.id,
      organization.name,
      'Duplicate organization removed automatically to enforce one organization per owner'
    );
  }

  return {
    keptOrganizationId: organizationToKeep.id,
    deletedOrganizationIds,
  };
};

export const getPlanSeatLimit = (plan: OrganizationPlan | string | null | undefined): number => {
  return plan === 'business' ? ORGANIZATION_PLAN_LIMITS.business : ORGANIZATION_PLAN_LIMITS.free;
};
