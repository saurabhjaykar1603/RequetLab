import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthCookie } from '../helpers/auth.ts';

vi.mock('../../repositories/collectionRepository.ts', () => ({
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  getAllCollections: vi.fn(),
  updateCollection: vi.fn(),
}));

vi.mock('../../repositories/importRepository.ts', () => ({
  importCollectionTree: vi.fn(),
}));

vi.mock('../../repositories/workspaceRepository.ts', () => ({
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
  addMemberToWorkspace: vi.fn(),
}));

vi.mock('../../repositories/authRepository.ts', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
}));

vi.mock('../../repositories/requestRepository.ts', () => ({
  createRequest: vi.fn(),
  deleteRequest: vi.fn(),
  getAllRequests: vi.fn(),
  getRequestsByCollectionId: vi.fn(),
  getRequestsByFolderId: vi.fn(),
  updateRequest: vi.fn(),
}));

const authRepository = await import('../../repositories/authRepository.ts');
const collectionRepository = await import('../../repositories/collectionRepository.ts');
const importRepository = await import('../../repositories/importRepository.ts');
const requestRepository = await import('../../repositories/requestRepository.ts');
const workspaceRepository = await import('../../repositories/workspaceRepository.ts');
const { buildApp } = await import('../../app.ts');

describe('collection and request routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp({ logger: false, serveClient: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('loads collections for the active workspace', async () => {
    vi.mocked(collectionRepository.getAllCollections).mockResolvedValue([
      { id: 'col-1', name: 'Core APIs' },
    ] as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/collections',
      headers: {
        cookie: createAuthCookie(),
        'x-workspace-id': 'ws-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: 'col-1', name: 'Core APIs' }]);
    expect(collectionRepository.getAllCollections).toHaveBeenCalledWith('ws-1');
  });

  it('auto-creates a workspace when importing a collection without workspace context', async () => {
    vi.mocked(workspaceRepository.getUserWorkspaces).mockResolvedValue([]);
    vi.mocked(authRepository.findUserById).mockResolvedValue({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
    } as any);
    vi.mocked(workspaceRepository.createWorkspace).mockResolvedValue({
      id: 'ws-1',
      name: "Ada's Workspace",
      type: 'personal',
    } as any);
    vi.mocked(importRepository.importCollectionTree).mockResolvedValue({
      id: 'col-1',
      name: 'Imported Collection',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/collections/import',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        name: 'Imported Collection',
        requests: [],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: 'col-1',
      name: 'Imported Collection',
      workspaceId: 'ws-1',
    });
    expect(workspaceRepository.createWorkspace).toHaveBeenCalledWith(
      "Ada's Workspace",
      'user-1',
      'personal'
    );
    expect(importRepository.importCollectionTree).toHaveBeenCalledWith(
      { name: 'Imported Collection', requests: [] },
      'user-1',
      'ws-1'
    );
  });

  it('parses serialized request fields when loading requests', async () => {
    vi.mocked(requestRepository.getRequestsByCollectionId).mockResolvedValue([
      {
        id: 'req-1',
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: '[{"key":"Accept","value":"application/json"}]',
        params: '[{"key":"page","value":"1"}]',
        body: null,
        auth: '{"type":"none"}',
      },
    ] as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests?collectionId=col-1',
      headers: {
        cookie: createAuthCookie(),
        'x-workspace-id': 'ws-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: 'req-1',
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Accept', value: 'application/json' }],
        params: [{ key: 'page', value: '1' }],
        body: null,
        auth: { type: 'none' },
      },
    ]);
  });

  it('parses serialized request fields on create', async () => {
    vi.mocked(requestRepository.createRequest).mockResolvedValue({
      id: 'req-1',
      name: 'Create User',
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: '[{"key":"Content-Type","value":"application/json"}]',
      params: '[]',
      body: '{"type":"json","content":"{\\"name\\":\\"Ada\\"}"}',
      auth: '{"type":"bearer"}',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        name: 'Create User',
        collectionId: 'col-1',
        method: 'POST',
        url: 'https://api.example.com/users',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: 'req-1',
      name: 'Create User',
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      params: [],
      body: { type: 'json', content: '{"name":"Ada"}' },
      auth: { type: 'bearer' },
    });
  });
});
