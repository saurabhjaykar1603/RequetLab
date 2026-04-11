import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthCookie } from '../helpers/auth.ts';

vi.mock('../../repositories/environmentRepository.ts', () => ({
  createEnvironment: vi.fn(),
  deleteEnvironment: vi.fn(),
  getAllEnvironments: vi.fn(),
  getEnvironmentById: vi.fn(),
  updateEnvironment: vi.fn(),
}));

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

vi.mock('../../repositories/activityRepository.ts', () => ({
  logActivity: vi.fn(),
  getActivityLogs: vi.fn(),
  getActivityLogsCount: vi.fn(),
}));

const activityRepository = await import('../../repositories/activityRepository.ts');
const environmentRepository = await import('../../repositories/environmentRepository.ts');
const workspaceRepository = await import('../../repositories/workspaceRepository.ts');
const { buildApp } = await import('../../app.ts');

describe('environment, activity, and proxy routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp({ logger: false, serveClient: false });
    await app.ready();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    delete process.env.API_HOST;
    await app.close();
  });

  it('requires a workspace header when loading environments', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/environments',
      headers: {
        cookie: createAuthCookie(),
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Workspace ID is required' });
  });

  it('rejects environment access for non-members', async () => {
    vi.mocked(workspaceRepository.getMemberRole).mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'GET',
      url: '/api/environments',
      headers: {
        cookie: createAuthCookie(),
        'x-workspace-id': 'ws-1',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: 'You do not have access to this workspace',
    });
  });

  it('parses environment variables on create', async () => {
    vi.mocked(workspaceRepository.getMemberRole).mockResolvedValue('admin');
    vi.mocked(environmentRepository.createEnvironment).mockResolvedValue({
      id: 'env-1',
      name: 'Local',
      variables: '{"API_URL":"http://localhost:3001"}',
      workspaceId: 'ws-1',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/environments',
      headers: {
        cookie: createAuthCookie(),
        'x-workspace-id': 'ws-1',
      },
      payload: {
        name: 'Local',
        variables: {
          API_URL: 'http://localhost:3001',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: 'env-1',
      name: 'Local',
      variables: {
        API_URL: 'http://localhost:3001',
      },
      workspaceId: 'ws-1',
    });
  });

  it('requires a workspace header for activity logs', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/activity',
      headers: {
        cookie: createAuthCookie(),
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Workspace ID is required' });
  });

  it('returns paginated activity logs for an authorized member', async () => {
    vi.mocked(workspaceRepository.getMemberRole).mockResolvedValue('member');
    vi.mocked(activityRepository.getActivityLogs).mockResolvedValue([
      { id: 'log-1', action: 'CREATE', entityType: 'REQUEST' },
    ] as any);
    vi.mocked(activityRepository.getActivityLogsCount).mockResolvedValue(1);

    const response = await app.inject({
      method: 'GET',
      url: '/api/activity?limit=10&offset=0&action=CREATE',
      headers: {
        cookie: createAuthCookie(),
        'x-workspace-id': 'ws-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      logs: [{ id: 'log-1', action: 'CREATE', entityType: 'REQUEST' }],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });

  it('executes proxy requests without auth and returns upstream response metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: vi.fn().mockResolvedValue('{"ok":true}'),
    });

    vi.stubGlobal('fetch', fetchMock);
    process.env.API_HOST = 'api.example.com';

    const response = await app.inject({
      method: 'POST',
      url: '/api/proxy',
      payload: {
        url: 'https://{{API_HOST}}/health',
        method: 'GET',
        params: [{ key: 'verbose', value: '1' }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
      },
      data: {
        ok: true,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/health?verbose=1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns a structured proxy error payload on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const response = await app.inject({
      method: 'POST',
      url: '/api/proxy',
      payload: {
        url: 'https://api.example.com/health',
        method: 'GET',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 0,
      statusText: 'Error',
      size: 0,
      headers: {},
      data: 'network down',
    });
  });
});
