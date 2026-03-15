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

const request = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getHeaders(),
    },
    credentials: 'include'
  });

  const data = await res.json();
  
  const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/logout');
  if (res.status === 401 || (data.error && data.error.includes('Unauthorized'))) {
    if (api.onUnauthorized && !isAuthRoute) api.onUnauthorized();
  }

  return data;
};

export const api = {
  onUnauthorized: null,

  // Auth
  login: async (email, password) => {
    return request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  },
  signup: async (name, email, password) => {
    return request(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
  },
  logout: async () => {
    return request(`${BASE_URL}/auth/logout`, {
      method: 'POST'
    });
  },

  // Workspaces
  getWorkspaces: async () => {
    return request(`${BASE_URL}/workspaces`);
  },
  createWorkspace: async (name, type = 'personal') => {
    return request(`${BASE_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
  },
  deleteWorkspace: async (id) => {
    return request(`${BASE_URL}/workspaces/${id}`, {
      method: 'DELETE'
    });
  },
  inviteMember: async (workspaceId, email, role = 'member') => {
    return request(`${BASE_URL}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });
  },
  getWorkspaceMembers: async (workspaceId) => {
    return request(`${BASE_URL}/workspaces/${workspaceId}/members`);
  },
  removeWorkspaceMember: async (workspaceId, userId) => {
    return request(`${BASE_URL}/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE'
    });
  },
  getInvitations: async () => {
    return request(`${BASE_URL}/workspaces/invitations`);
  },
  respondToInvitation: async (invitationId, status) => {
    return request(`${BASE_URL}/workspaces/invitations/${invitationId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  // Collections
  getCollections: async () => {
    return request(`${BASE_URL}/collections`);
  },
  createCollection: async (name) => {
    return request(`${BASE_URL}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  },
  updateCollection: async (id, name) => {
    return request(`${BASE_URL}/collections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  },
  deleteCollection: async (id) => {
    return request(`${BASE_URL}/collections/${id}`, { 
      method: 'DELETE'
    });
  },

  // Folders
  getFolders: async (collectionId) => {
    return request(`${BASE_URL}/folders${collectionId ? `?collectionId=${collectionId}` : ''}`);
  },
  createFolder: async (name, collectionId) => {
    return request(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, collectionId })
    });
  },
  updateFolder: async (id, name) => {
    return request(`${BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  },
  deleteFolder: async (id) => {
    return request(`${BASE_URL}/folders/${id}`, { 
      method: 'DELETE'
    });
  },

  // Requests
  getRequests: async (collectionId, folderId) => {
    let url = `${BASE_URL}/requests`;
    if (folderId) url += `?folderId=${folderId}`;
    else if (collectionId) url += `?collectionId=${collectionId}`;
    return request(url);
  },
  getAllRequests: async () => {
    return request(`${BASE_URL}/requests`);
  },
  createRequest: async (data) => {
    return request(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  updateRequest: async (id, data) => {
    return request(`${BASE_URL}/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  deleteRequest: async (id) => {
    return request(`${BASE_URL}/requests/${id}`, { 
      method: 'DELETE'
    });
  },

  // Environments
  getEnvironments: async () => {
    return request(`${BASE_URL}/environments`);
  },
  createEnvironment: async (name, variables = {}) => {
    return request(`${BASE_URL}/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, variables })
    });
  },
  updateEnvironment: async (id, name, variables = {}) => {
    return request(`${BASE_URL}/environments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, variables })
    });
  },
  deleteEnvironment: async (id) => {
    return request(`${BASE_URL}/environments/${id}`, {
      method: 'DELETE'
    });
  },

  // Execution
  executeRequest: async (config) => {
    return request(`${BASE_URL}/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },
  importCollection: async (tree) => {
    return request(`${BASE_URL}/collections/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tree)
    });
  },
  getActivityLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);

    return request(`${BASE_URL}/activity?${params.toString()}`);
  }
};
