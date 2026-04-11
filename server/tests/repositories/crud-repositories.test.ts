import { beforeEach, describe, expect, it, vi } from 'vitest';

const uuidMock = vi.fn();
const getQueryMock = vi.fn();
const getSingleQueryMock = vi.fn();
const runQueryMock = vi.fn();

vi.mock('uuid', () => ({
  v4: uuidMock,
}));

vi.mock('../../db.ts', () => ({
  getQuery: getQueryMock,
  getSingleQuery: getSingleQueryMock,
  runQuery: runQueryMock,
  withTransaction: vi.fn(),
}));

const logActivityMock = vi.fn();

vi.mock('../../repositories/activityRepository.ts', async () => {
  const actual = await vi.importActual<typeof import('../../repositories/activityRepository.ts')>('../../repositories/activityRepository.ts');
  return {
    ...actual,
    logActivity: logActivityMock,
  };
});

const activityRepository = await import('../../repositories/activityRepository.ts');
const authRepository = await import('../../repositories/authRepository.ts');
const collectionRepository = await import('../../repositories/collectionRepository.ts');
const environmentRepository = await import('../../repositories/environmentRepository.ts');
const folderRepository = await import('../../repositories/folderRepository.ts');
const requestRepository = await import('../../repositories/requestRepository.ts');

describe('crud repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user and logs signup activity', async () => {
    uuidMock.mockReturnValue('user-1');
    runQueryMock.mockResolvedValue({
      rows: [{ id: 'user-1', name: 'Ada', email: 'ada@example.com', googleId: undefined, avatarUrl: undefined }],
    });

    const user = await authRepository.createUser('Ada', 'ada@example.com', 'hashed');

    expect(runQueryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users (id, name, email, password, "googleId", "avatarUrl")'),
      ['user-1', 'Ada', 'ada@example.com', 'hashed', undefined, undefined]
    );
    expect(logActivityMock).toHaveBeenCalledWith(
      'user-1',
      undefined,
      'SIGNUP',
      'USER',
      'user-1',
      'Ada',
      'New user registered: ada@example.com'
    );
    expect(user).toEqual({ id: 'user-1', name: 'Ada', email: 'ada@example.com', googleId: undefined, avatarUrl: undefined });
  });

  it('creates a collection and logs workspace activity', async () => {
    uuidMock.mockReturnValue('col-1');
    getSingleQueryMock.mockResolvedValue({
      id: 'col-1',
      name: 'Core APIs',
      workspaceId: 'ws-1',
    });

    const collection = await collectionRepository.createCollection(
      'Core APIs',
      'user-1',
      'ws-1'
    );

    expect(runQueryMock).toHaveBeenCalledWith(
      'INSERT INTO collections (id, name, "userId", "workspaceId") VALUES ($1, $2, $3, $4)',
      ['col-1', 'Core APIs', 'user-1', 'ws-1']
    );
    expect(logActivityMock).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
      'CREATE',
      'COLLECTION',
      'col-1',
      'Core APIs'
    );
    expect(collection).toEqual({
      id: 'col-1',
      name: 'Core APIs',
      workspaceId: 'ws-1',
    });
  });

  it('updates a folder and records the rename details', async () => {
    getSingleQueryMock
      .mockResolvedValueOnce({ id: 'folder-1', name: 'Old Name', collectionId: 'col-1' })
      .mockResolvedValueOnce({ id: 'folder-1', name: 'New Name', collectionId: 'col-1' })
      .mockResolvedValueOnce({ id: 'col-1', workspaceId: 'ws-1' });

    const folder = await folderRepository.updateFolder('folder-1', 'New Name', 'user-1');

    expect(runQueryMock).toHaveBeenCalledWith(
      'UPDATE folders SET name = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
      ['New Name', 'folder-1']
    );
    expect(logActivityMock).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
      'UPDATE',
      'FOLDER',
      'folder-1',
      'New Name',
      'Renamed from Old Name to New Name'
    );
    expect(folder).toEqual({ id: 'folder-1', name: 'New Name', collectionId: 'col-1' });
  });

  it('creates an environment and serializes variables', async () => {
    uuidMock.mockReturnValue('env-1');
    getSingleQueryMock.mockResolvedValue({
      id: 'env-1',
      name: 'Local',
      variables: '{"API_URL":"http://localhost:3001"}',
      workspaceId: 'ws-1',
    });

    const environment = await environmentRepository.createEnvironment(
      'Local',
      { API_URL: 'http://localhost:3001' },
      'ws-1',
      'user-1'
    );

    expect(runQueryMock).toHaveBeenCalledWith(
      'INSERT INTO environments (id, name, variables, "workspaceId") VALUES ($1, $2, $3, $4)',
      ['env-1', 'Local', '{"API_URL":"http://localhost:3001"}', 'ws-1']
    );
    expect(logActivityMock).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
      'CREATE',
      'ENVIRONMENT',
      'env-1',
      'Local'
    );
    expect(environment).toEqual({
      id: 'env-1',
      name: 'Local',
      variables: '{"API_URL":"http://localhost:3001"}',
      workspaceId: 'ws-1',
    });
  });

  it('builds partial updates for requests and logs the change', async () => {
    getSingleQueryMock
      .mockResolvedValueOnce({
        id: 'req-1',
        name: 'Old Request',
        collectionId: 'col-1',
      })
      .mockResolvedValueOnce({
        id: 'req-1',
        name: 'Updated Request',
        collectionId: 'col-1',
        method: 'PATCH',
      })
      .mockResolvedValueOnce({
        id: 'col-1',
        workspaceId: 'ws-1',
      });

    const request = await requestRepository.updateRequest(
      'req-1',
      {
        name: 'Updated Request',
        method: 'PATCH',
        headers: [{ key: 'Accept', value: 'application/json' }] as any,
      },
      'user-1'
    );

    expect(runQueryMock).toHaveBeenCalledWith(
      'UPDATE requests SET name = $1, method = $2, headers = $3, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $4',
      [
        'Updated Request',
        'PATCH',
        '[{"key":"Accept","value":"application/json"}]',
        'req-1',
      ]
    );
    expect(logActivityMock).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
      'UPDATE',
      'REQUEST',
      'req-1',
      'Updated Request',
      'Updated request configuration'
    );
    expect(request).toEqual({
      id: 'req-1',
      name: 'Updated Request',
      collectionId: 'col-1',
      method: 'PATCH',
    });
  });

  it('returns filtered activity logs and converts counts to numbers', async () => {
    getQueryMock
      .mockResolvedValueOnce([{ id: 'log-1', action: 'CREATE' }])
      .mockResolvedValueOnce([{ count: '3' }]);

    const logs = await activityRepository.getActivityLogs('ws-1', 10, 5, {
      action: 'CREATE',
    });
    const count = await activityRepository.getActivityLogsCount('ws-1', {
      entityType: 'REQUEST',
    });

    expect(getQueryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE al."workspaceId" = $1'),
      ['ws-1', 'CREATE', 10, 5]
    );
    expect(getQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE "workspaceId" = $1'),
      ['ws-1', 'REQUEST']
    );
    expect(logs).toEqual([{ id: 'log-1', action: 'CREATE' }]);
    expect(count).toBe(3);
  });
});
