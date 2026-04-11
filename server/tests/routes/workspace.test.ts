import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthCookie } from '../helpers/auth.ts';

vi.mock('../../repositories/workspaceRepository.ts', () => ({
  addMemberToWorkspace: vi.fn(),
  createInvitation: vi.fn(),
  createWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  findInvitationById: vi.fn(),
  findWorkspaceById: vi.fn(),
  getMemberRole: vi.fn(),
  getPendingInvitations: vi.fn(),
  getUserWorkspaces: vi.fn(),
  getWorkspaceMembers: vi.fn(),
  removeMemberFromWorkspace: vi.fn(),
  updateInvitationStatus: vi.fn(),
  updateWorkspace: vi.fn(),
}));

vi.mock('../../repositories/authRepository.ts', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
}));

const authRepository = await import('../../repositories/authRepository.ts');
const workspaceRepository = await import('../../repositories/workspaceRepository.ts');
const { buildApp } = await import('../../app.ts');

describe('workspace routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp({ logger: false, serveClient: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthenticated workspace access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/workspaces',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toContain('Unauthorized');
  });

  it('creates a workspace for the authenticated user', async () => {
    vi.mocked(workspaceRepository.createWorkspace).mockResolvedValue({
      id: 'ws-1',
      name: 'My Workspace',
      ownerId: 'user-1',
      type: 'personal',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspaces',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        name: 'My Workspace',
        type: 'personal',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: 'ws-1',
      name: 'My Workspace',
      ownerId: 'user-1',
      type: 'personal',
    });
    expect(workspaceRepository.createWorkspace).toHaveBeenCalledWith(
      'My Workspace',
      'user-1',
      'personal',
      'free'
    );
  });

  it('blocks invites for personal workspaces', async () => {
    vi.mocked(workspaceRepository.findWorkspaceById).mockResolvedValue({
      id: 'ws-1',
      name: 'Solo',
      type: 'personal',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspaces/ws-1/members',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        email: 'member@example.com',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Personal workspaces cannot have additional members',
    });
  });

  it('blocks invites from non-admin members', async () => {
    vi.mocked(workspaceRepository.findWorkspaceById).mockResolvedValue({
      id: 'ws-1',
      name: 'Team',
      type: 'team',
    } as any);
    vi.mocked(workspaceRepository.getMemberRole).mockResolvedValue('member');

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspaces/ws-1/members',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        email: 'member@example.com',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Only admins can invite members' });
  });

  it('accepts an invitation and adds the member to the workspace', async () => {
    vi.mocked(workspaceRepository.findInvitationById).mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviteeId: 'user-1',
      role: 'member',
      status: 'pending',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspaces/invitations/inv-1/respond',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        status: 'accepted',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true });
    expect(workspaceRepository.updateInvitationStatus).toHaveBeenCalledWith(
      'inv-1',
      'accepted'
    );
    expect(workspaceRepository.addMemberToWorkspace).toHaveBeenCalledWith(
      'ws-1',
      'user-1',
      'member'
    );
  });

  it('rejects invalid invitation response status values', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/workspaces/invitations/inv-1/respond',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        status: 'maybe',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid status' });
  });

  it('prevents non-admin users from deleting a workspace', async () => {
    vi.mocked(workspaceRepository.getMemberRole).mockResolvedValue('member');

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/workspaces/ws-1',
      headers: {
        cookie: createAuthCookie(),
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Only admins can delete workspaces' });
  });

  it('returns not found when inviting a missing user', async () => {
    vi.mocked(workspaceRepository.findWorkspaceById).mockResolvedValue({
      id: 'ws-1',
      name: 'Team',
      type: 'team',
    } as any);
    vi.mocked(workspaceRepository.getMemberRole).mockResolvedValue('admin');
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspaces/ws-1/members',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        email: 'ghost@example.com',
        role: 'member',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'User with this email not found',
    });
  });
});
