import { beforeEach, describe, expect, it, vi } from 'vitest';

const uuidMock = vi.fn();
const getQueryMock = vi.fn();
const getSingleQueryMock = vi.fn();
const runQueryMock = vi.fn();
const withTransactionMock = vi.fn();

vi.mock('uuid', () => ({
  v4: uuidMock,
}));

vi.mock('../../db.ts', () => ({
  getQuery: getQueryMock,
  getSingleQuery: getSingleQueryMock,
  runQuery: runQueryMock,
  withTransaction: withTransactionMock,
}));

const logActivityMock = vi.fn();
const findUserByIdMock = vi.fn();

vi.mock('../../repositories/activityRepository.ts', () => ({
  logActivity: logActivityMock,
  getActivityLogs: vi.fn(),
  getActivityLogsCount: vi.fn(),
}));

vi.mock('../../repositories/authRepository.ts', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: findUserByIdMock,
}));

const importRepository = await import('../../repositories/importRepository.ts');
const workspaceRepository = await import('../../repositories/workspaceRepository.ts');

describe('workspace and import repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a workspace, adds the owner, and logs activity', async () => {
    uuidMock.mockReturnValue('ws-1');
    runQueryMock.mockResolvedValue({
      rows: [{ id: 'ws-1', name: 'Platform', ownerId: 'user-1', type: 'team' }],
    });

    const workspace = await workspaceRepository.createWorkspace('Platform', 'user-1', 'team');

    expect(runQueryMock).toHaveBeenNthCalledWith(
      1,
      'INSERT INTO workspaces (id, name, "ownerId", type) VALUES ($1, $2, $3, $4) RETURNING *',
      ['ws-1', 'Platform', 'user-1', 'team']
    );
    expect(runQueryMock).toHaveBeenNthCalledWith(
      2,
      'INSERT INTO workspace_members ("workspaceId", "userId", role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      ['ws-1', 'user-1', 'admin']
    );
    expect(logActivityMock).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
      'CREATE',
      'WORKSPACE',
      'ws-1',
      'Platform',
      "Workspace 'Platform' created"
    );
    expect(workspace).toEqual({
      id: 'ws-1',
      name: 'Platform',
      ownerId: 'user-1',
      type: 'team',
    });
  });

  it('creates an invitation and logs who was invited', async () => {
    uuidMock.mockReturnValue('inv-1');
    runQueryMock.mockResolvedValue({
      rows: [{ id: 'inv-1', workspaceId: 'ws-1', inviteeId: 'user-2', role: 'member' }],
    });
    findUserByIdMock.mockResolvedValue({
      id: 'user-2',
      name: 'Grace',
      email: 'grace@example.com',
    });

    const invitation = await workspaceRepository.createInvitation(
      'ws-1',
      'user-1',
      'user-2',
      'member'
    );

    expect(runQueryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO workspace_invitations'),
      ['inv-1', 'ws-1', 'user-1', 'user-2', 'member']
    );
    expect(logActivityMock).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
      'INVITE',
      'USER',
      'user-2',
      'Grace',
      "Invited 'grace@example.com' to workspace as member"
    );
    expect(invitation).toEqual({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviteeId: 'user-2',
      role: 'member',
    });
  });

  it('imports a collection tree inside a transaction', async () => {
    uuidMock
      .mockReturnValueOnce('col-1')
      .mockReturnValueOnce('req-root-1')
      .mockReturnValueOnce('folder-1')
      .mockReturnValueOnce('req-folder-1');

    const client = {
      query: vi.fn().mockResolvedValue(undefined),
    };

    withTransactionMock.mockImplementation(async (callback) => callback(client));

    const result = await importRepository.importCollectionTree(
      {
        name: 'Imported',
        requests: [{ name: 'Root Request', method: 'GET', url: 'https://api.example.com' }],
        folders: [
          {
            name: 'Folder A',
            requests: [{ name: 'Nested Request', method: 'POST', url: 'https://api.example.com/items' }],
          },
        ],
      },
      'user-1',
      'ws-1'
    );

    expect(withTransactionMock).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'INSERT INTO collections (id, name, "userId", "workspaceId") VALUES ($1, $2, $3, $4)',
      ['col-1', 'Imported', 'user-1', 'ws-1']
    );
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO requests'),
      [
        'req-root-1',
        'Root Request',
        'GET',
        'https://api.example.com',
        '[]',
        null,
        '[]',
        '{}',
        '',
        '',
        null,
        'col-1',
      ]
    );
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      'INSERT INTO folders (id, name, "collectionId") VALUES ($1, $2, $3)',
      ['folder-1', 'Folder A', 'col-1']
    );
    expect(client.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO requests'),
      [
        'req-folder-1',
        'Nested Request',
        'POST',
        'https://api.example.com/items',
        '[]',
        null,
        '[]',
        '{}',
        '',
        '',
        'folder-1',
        'col-1',
      ]
    );
    expect(result).toEqual({ id: 'col-1', name: 'Imported' });
  });
});
