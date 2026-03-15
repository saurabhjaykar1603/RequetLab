const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => {
  const headers = {};
  const workspaceId = localStorage.getItem('activeWorkspaceId');
  if (workspaceId) headers['x-workspace-id'] = workspaceId;
  return headers;
};

const getPostHeaders = () => {
  return { ...getHeaders(), 'Content-Type': 'application/json' };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    return res.json();
  },
  signup: async (name, email, password) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    });
    return res.json();
  },
  logout: async () => {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  // Workspaces
  getWorkspaces: async () => {
    const res = await fetch(`${BASE_URL}/workspaces`, { headers: getHeaders(), credentials: 'include' });
    return res.json();
  },
  createWorkspace: async (name, type = 'personal') => {
    const res = await fetch(`${BASE_URL}/workspaces`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify({ name, type }),
      credentials: 'include'
    });
    return res.json();
  },
  deleteWorkspace: async (id) => {
    const res = await fetch(`${BASE_URL}/workspaces/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },
  inviteMember: async (workspaceId, email, role = 'member') => {
    const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify({ email, role }),
      credentials: 'include'
    });
    return res.json();
  },
  getWorkspaceMembers: async (workspaceId) => {
    const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}/members`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },
  removeWorkspaceMember: async (workspaceId, userId) => {
    const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },
  getInvitations: async () => {
    const res = await fetch(`${BASE_URL}/workspaces/invitations`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },
  respondToInvitation: async (invitationId, status) => {
    const res = await fetch(`${BASE_URL}/workspaces/invitations/${invitationId}/respond`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify({ status }),
      credentials: 'include'
    });
    return res.json();
  },

  // Collections
  getCollections: async () => {
    const res = await fetch(`${BASE_URL}/collections`, { headers: getHeaders(), credentials: 'include' });
    return res.json();
  },
  createCollection: async (name) => {
    const res = await fetch(`${BASE_URL}/collections`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify({ name }),
      credentials: 'include'
    });
    return res.json();
  },
  updateCollection: async (id, name) => {
    const res = await fetch(`${BASE_URL}/collections/${id}`, {
      method: 'PUT',
      headers: getPostHeaders(),
      body: JSON.stringify({ name }),
      credentials: 'include'
    });
    return res.json();
  },
  deleteCollection: async (id) => {
    const res = await fetch(`${BASE_URL}/collections/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  // Folders
  getFolders: async (collectionId) => {
    const res = await fetch(`${BASE_URL}/folders${collectionId ? `?collectionId=${collectionId}` : ''}`, { headers: getHeaders(), credentials: 'include' });
    return res.json();
  },
  createFolder: async (name, collectionId) => {
    const res = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify({ name, collectionId }),
      credentials: 'include'
    });
    return res.json();
  },
  updateFolder: async (id, name) => {
    const res = await fetch(`${BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: getPostHeaders(),
      body: JSON.stringify({ name }),
      credentials: 'include'
    });
    return res.json();
  },
  deleteFolder: async (id) => {
    const res = await fetch(`${BASE_URL}/folders/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  // Requests
  getRequests: async (collectionId, folderId) => {
    let url = `${BASE_URL}/requests`;
    if (folderId) url += `?folderId=${folderId}`;
    else if (collectionId) url += `?collectionId=${collectionId}`;
    const res = await fetch(url, { headers: getHeaders(), credentials: 'include' });
    return res.json();
  },
  getAllRequests: async () => {
    const res = await fetch(`${BASE_URL}/requests`, { headers: getHeaders(), credentials: 'include' });
    return res.json();
  },
  createRequest: async (data) => {
    const res = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return res.json();
  },
  updateRequest: async (id, data) => {
    const res = await fetch(`${BASE_URL}/requests/${id}`, {
      method: 'PUT',
      headers: getPostHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return res.json();
  },
  deleteRequest: async (id) => {
    const res = await fetch(`${BASE_URL}/requests/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  // Environments
  getEnvironments: async () => {
    const res = await fetch(`${BASE_URL}/environments`, { headers: getHeaders(), credentials: 'include' });
    return res.json();
  },
  createEnvironment: async (name, variables = {}) => {
    const res = await fetch(`${BASE_URL}/environments`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify({ name, variables }),
      credentials: 'include'
    });
    return res.json();
  },
  updateEnvironment: async (id, name, variables = {}) => {
    const res = await fetch(`${BASE_URL}/environments/${id}`, {
      method: 'PUT',
      headers: getPostHeaders(),
      body: JSON.stringify({ name, variables }),
      credentials: 'include'
    });
    return res.json();
  },
  deleteEnvironment: async (id) => {
    const res = await fetch(`${BASE_URL}/environments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  // Execution
  executeRequest: async (config) => {
    const res = await fetch(`${BASE_URL}/proxy`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify(config),
      credentials: 'include'
    });
    return res.json();
  },
  importCollection: async (tree) => {
    const res = await fetch(`${BASE_URL}/collections/import`, {
      method: 'POST',
      headers: getPostHeaders(),
      body: JSON.stringify(tree),
      credentials: 'include'
    });
    return res.json();
  },
  getActivityLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);

    const res = await fetch(`${BASE_URL}/activity?${params.toString()}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    return res.json();
  }
};
