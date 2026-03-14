const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  // Collections
  getCollections: async () => {
    const res = await fetch(`${BASE_URL}/collections`);
    return res.json();
  },
  createCollection: async (name) => {
    const res = await fetch(`${BASE_URL}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userId: 'user_1' })
    });
    return res.json();
  },
  updateCollection: async (id, name) => {
    const res = await fetch(`${BASE_URL}/collections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },
  deleteCollection: async (id) => {
    const res = await fetch(`${BASE_URL}/collections/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Folders
  getFolders: async (collectionId) => {
    const res = await fetch(`${BASE_URL}/folders${collectionId ? `?collectionId=${collectionId}` : ''}`);
    return res.json();
  },
  createFolder: async (name, collectionId) => {
    const res = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, collectionId })
    });
    return res.json();
  },
  updateFolder: async (id, name) => {
    const res = await fetch(`${BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },
  deleteFolder: async (id) => {
    const res = await fetch(`${BASE_URL}/folders/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Requests
  getRequests: async (collectionId, folderId) => {
    let url = `${BASE_URL}/requests`;
    if (folderId) url += `?folderId=${folderId}`;
    else if (collectionId) url += `?collectionId=${collectionId}`;
    const res = await fetch(url);
    return res.json();
  },
  getAllRequests: async () => {
    const res = await fetch(`${BASE_URL}/requests`);
    return res.json();
  },
  createRequest: async (data) => {
    const res = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateRequest: async (id, data) => {
    const res = await fetch(`${BASE_URL}/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteRequest: async (id) => {
    const res = await fetch(`${BASE_URL}/requests/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Environments
  getEnvironments: async () => {
    const res = await fetch(`${BASE_URL}/environments`);
    return res.json();
  },
  createEnvironment: async (name, variables = {}) => {
    const res = await fetch(`${BASE_URL}/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, variables })
    });
    return res.json();
  },

  // Execution
  executeRequest: async (config) => {
    const res = await fetch(`${BASE_URL}/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },
  importCollection: async (tree) => {
    const res = await fetch(`${BASE_URL}/collections/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tree)
    });
    return res.json();
  }
};
