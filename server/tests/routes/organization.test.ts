import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthCookie } from '../helpers/auth.ts';

vi.mock('../../repositories/organizationRepository.ts', () => ({
  addMemberToOrganization: vi.fn(),
  cleanupExtraOrganizationsForOwner: vi.fn(),
  countOrganizationMembers: vi.fn(),
  createOrganization: vi.fn(),
  findOrganizationById: vi.fn(),
  findOrganizationByOwnerId: vi.fn(),
  getOrganizationMemberRole: vi.fn(),
  getOrganizationMembers: vi.fn(),
  getPlanSeatLimit: vi.fn(),
  getUserOrganizations: vi.fn(),
  updateOrganizationPlan: vi.fn(),
}));

vi.mock('../../repositories/authRepository.ts', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock('../../repositories/activityRepository.ts', () => ({
  logActivity: vi.fn(),
  getActivityLogs: vi.fn(),
  getActivityLogsCount: vi.fn(),
}));

const authRepository = await import('../../repositories/authRepository.ts');
const organizationRepository = await import('../../repositories/organizationRepository.ts');
const { buildApp } = await import('../../app.ts');

describe('organization routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp({ logger: false, serveClient: false });
    await app.ready();

    vi.mocked(organizationRepository.getPlanSeatLimit).mockImplementation((plan: any) => {
      if (plan === 'business') return 25;
      return 3;
    });
    vi.mocked(organizationRepository.cleanupExtraOrganizationsForOwner).mockResolvedValue({
      keptOrganizationId: undefined,
      deletedOrganizationIds: [],
    } as any);
    vi.mocked(organizationRepository.findOrganizationByOwnerId).mockResolvedValue(undefined as any);
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthenticated organization access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/organizations',
    });

    expect(response.statusCode).toBe(401);
  });

  it('cleans up duplicate owned organizations before listing', async () => {
    vi.mocked(organizationRepository.getUserOrganizations).mockResolvedValue([
      {
        id: 'org-1',
        ownerId: 'user-1',
        name: 'Alpha Org',
        plan: 'free',
        role: 'admin',
        memberCount: 1,
      },
    ] as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/organizations',
      headers: {
        cookie: createAuthCookie(),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(organizationRepository.cleanupExtraOrganizationsForOwner).toHaveBeenCalledWith('user-1');
  });

  it('creates an organization on the selected plan', async () => {
    vi.mocked(organizationRepository.createOrganization).mockResolvedValue({
      id: 'org-1',
      name: 'Alpha Org',
      ownerId: 'user-1',
      plan: 'business',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/organizations',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        name: 'Alpha Org',
        plan: 'business',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: 'org-1',
      name: 'Alpha Org',
      plan: 'business',
      seatLimit: 25,
      memberCount: 1,
      role: 'admin',
    });
  });

  it('prevents creating more than one organization for the same owner', async () => {
    vi.mocked(organizationRepository.findOrganizationByOwnerId).mockResolvedValue({
      id: 'org-1',
      ownerId: 'user-1',
      name: 'Existing Org',
      plan: 'free',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/organizations',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        name: 'Second Org',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'You can create only one organization per account',
    });
    expect(organizationRepository.createOrganization).not.toHaveBeenCalled();
  });

  it('blocks member assignment when requester is not an admin', async () => {
    vi.mocked(organizationRepository.findOrganizationById).mockResolvedValue({
      id: 'org-1',
      name: 'Alpha Org',
      plan: 'free',
      ownerId: 'user-1',
    } as any);
    vi.mocked(organizationRepository.getOrganizationMemberRole).mockResolvedValue('member' as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/organizations/org-1/members',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        email: 'teammate@example.com',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Only organization admins can add members' });
  });

  it('adds a user to an organization when capacity allows', async () => {
    vi.mocked(organizationRepository.findOrganizationById).mockResolvedValue({
      id: 'org-1',
      name: 'Alpha Org',
      plan: 'business',
      ownerId: 'user-1',
    } as any);

    vi.mocked(organizationRepository.getOrganizationMemberRole)
      .mockResolvedValueOnce('admin' as any)
      .mockResolvedValueOnce(undefined as any);

    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
      id: 'user-2',
      name: 'Grace',
      email: 'grace@example.com',
    } as any);

    vi.mocked(organizationRepository.countOrganizationMembers).mockResolvedValue(2);

    const response = await app.inject({
      method: 'POST',
      url: '/api/organizations/org-1/members',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        email: 'grace@example.com',
        role: 'member',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      role: 'member',
      memberCount: 3,
      seatLimit: 25,
      user: {
        id: 'user-2',
        name: 'Grace',
        email: 'grace@example.com',
      },
    });
    expect(organizationRepository.addMemberToOrganization).toHaveBeenCalledWith('org-1', 'user-2', 'member');
  });

  it('updates organization plan for admins', async () => {
    vi.mocked(organizationRepository.findOrganizationById).mockResolvedValue({
      id: 'org-1',
      name: 'Alpha Org',
      ownerId: 'user-1',
      plan: 'free',
    } as any);
    vi.mocked(organizationRepository.getOrganizationMemberRole).mockResolvedValue('admin' as any);
    vi.mocked(organizationRepository.updateOrganizationPlan).mockResolvedValue({
      id: 'org-1',
      name: 'Alpha Org',
      ownerId: 'user-1',
      plan: 'business',
    } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/organizations/org-1/plan',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        plan: 'business',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 'org-1',
      plan: 'business',
      seatLimit: 25,
    });
  });
});
