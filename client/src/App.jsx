import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import { useToast } from 'toast-ninja';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/dashboard/Dashboard';
import Modals from './components/dashboard/Modals';
import { generateCurl, parseCurl } from './utils/curlUtils';
import { resolveRequestVariables } from './utils/variableUtils';
import './index.css';

// Helpers
const parseJSONStr = (str, fallback) => {
  try { return JSON.parse(str); } catch (e) { return fallback; }
};

export default function App() {
  const { showToast } = useToast();
  const [collections, setCollections] = useState([]);
  const [folders, setFolders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [environments, setEnvironments] = useState([]);

  const [activeTab, setActiveTab] = useState('collections');
  const [expanded, setExpanded] = useState({});
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeEnvId, setActiveEnvId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [editorTab, setEditorTab] = useState('params');
  const [response, setResponse] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [modalOpen, setModalOpen] = useState(null);
  const [modalData, setModalData] = useState({});
  const [theme, setTheme] = useState('dark');

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => localStorage.getItem('activeWorkspaceId') || '');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [globals, setGlobals] = useState(() => JSON.parse(localStorage.getItem('globals') || '{}'));

  useEffect(() => {
    localStorage.setItem('globals', JSON.stringify(globals));
  }, [globals]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    api.onUnauthorized = () => handleLogout('Your session has expired. Please log in again.');
    return () => { api.onUnauthorized = null; };
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      // Always fetch workspaces
      const wks = await api.getWorkspaces();
      setWorkspaces(wks || []);

      let currentWorkspaceId = activeWorkspaceId;

      // If no active workspace, pick the first one
      if (wks && wks.length > 0 && !currentWorkspaceId) {
        currentWorkspaceId = wks[0].id;
        handleWorkspaceChange(currentWorkspaceId);
      }

      // Only fetch other data if we have a workspace ID
      if (currentWorkspaceId) {
        const [cols, flds, reqs, envs] = await Promise.all([
          api.getCollections(),
          api.getFolders(),
          api.getAllRequests(),
          api.getEnvironments()
        ]);
        setCollections(cols || []);
        setFolders(flds || []);
        setRequests(reqs || []);
        setEnvironments(envs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      fetchInvitations();
    }
  }, [user, activeWorkspaceId]);

  const handleLogout = async (message = 'Logged out successfully') => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout logging failed', err);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('activeWorkspaceId');
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceId('');
    setCollections([]);
    setFolders([]);
    setRequests([]);
    setActiveRequest(null);
    showToast({ message, type: 'info' });
  };

  const handleWorkspaceChange = (id) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('activeWorkspaceId', id);
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createWorkspace(modalData.workspaceName, modalData.workspaceType || 'personal');
      if (res.error) throw new Error(res.error);
      setModalOpen(null);
      setModalData({});
      await loadData();
      handleWorkspaceChange(res.id);
      showToast({ message: 'Workspace created!', type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteWorkspace = async (id) => {
    try {
      const res = await api.deleteWorkspace(id);
      if (res.error) throw new Error(res.error);

      const updatedWorkspaces = workspaces.filter(w => w.id !== id);
      setWorkspaces(updatedWorkspaces);

      if (id === activeWorkspaceId) {
        if (updatedWorkspaces.length > 0) {
          handleWorkspaceChange(updatedWorkspaces[0].id);
        } else {
          setActiveWorkspaceId('');
          localStorage.removeItem('activeWorkspaceId');
          setCollections([]);
          setFolders([]);
          setRequests([]);
          setActiveRequest(null);
        }
      }

      showToast({ message: 'Workspace deleted', type: 'success' });
      setModalOpen(null);
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateWorkspaceName = async (id, name) => {
    if (!name) return;
    try {
      const res = await api.updateWorkspace(id, name);
      if (res.error) throw new Error(res.error);
      
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w));
      showToast({ message: 'Workspace renamed', type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      const { workspaceId, email, role } = modalData;
      const res = await api.inviteMember(workspaceId, email, role || 'member');
      if (res.error) throw new Error(res.error);

      showToast({ message: `Invited ${res.user.email} successfully!`, type: 'success' });
      setModalOpen('workspace-switch');
      setModalData({});
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const fetchMembers = async (workspaceId) => {
    try {
      const members = await api.getWorkspaceMembers(workspaceId);
      setWorkspaceMembers(members || []);
    } catch (err) {
      showToast({ message: 'Failed to fetch members', type: 'error' });
    }
  };

  const handleRemoveMember = async (workspaceId, userId) => {
    try {
      const res = await api.removeWorkspaceMember(workspaceId, userId);
      if (res.error) throw new Error(res.error);

      showToast({ message: 'Member removed', type: 'success' });
      fetchMembers(workspaceId);
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const fetchInvitations = async () => {
    try {
      if (!user) return;
      const invitations = await api.getInvitations();
      setPendingInvitations(invitations || []);
    } catch (err) {
      console.error('Failed to fetch invitations', err);
    }
  };

  const handleRespondToInvitation = async (invitationId, status) => {
    try {
      const res = await api.respondToInvitation(invitationId, status);
      if (res.error) throw new Error(res.error);

      showToast({ message: `Invitation ${status}`, type: 'success' });
      fetchInvitations();
      if (status === 'accepted') {
        const updatedWorkspaces = await api.getWorkspaces();
        setWorkspaces(updatedWorkspaces || []);
      }
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const tree = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!Array.isArray(collections)) return [];
    return collections.map(col => {
      const colFolders = folders.filter(f => f.collectionId === col.id).map(f => {
        const folderReqs = requests.filter(r => r.folderId === f.id);
        const filteredReqs = folderReqs.filter(r => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
        return { ...f, requests: filteredReqs, match: f.name.toLowerCase().includes(q) || filteredReqs.length > 0 };
      });
      const filteredFolders = colFolders.filter(f => f.match);
      const standaloneReqs = requests.filter(r => r.collectionId === col.id && (!r.folderId || r.folderId === ''));
      const filteredStandalone = standaloneReqs.filter(r => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
      const match = col.name.toLowerCase().includes(q) || filteredFolders.length > 0 || filteredStandalone.length > 0;
      return { ...col, folders: filteredFolders, requests: filteredStandalone, match };
    }).filter(col => col.match);
  }, [collections, folders, requests, searchQuery]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setExpanded(prev => {
        const newExpanded = { ...prev };
        tree.forEach(col => {
          newExpanded[col.id] = true;
          col.folders.forEach(f => {
            newExpanded[f.id] = true;
          });
        });
        return newExpanded;
      });
    }
  }, [searchQuery, tree]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!modalData.name) return;
    await api.createCollection(modalData.name);
    setModalOpen(null);
    setModalData({});
    loadData();
  };

  const handleCreateEnvironment = async (e) => {
    e.preventDefault();
    if (!modalData.name) return;
    try {
      const res = await api.createEnvironment(modalData.name, modalData.variables || {});
      if (res.error) throw new Error(res.error);
      setModalOpen(null);
      setModalData({});
      await loadData();
      showToast({ message: 'Environment created!', type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateEnvironment = async (e) => {
    e.preventDefault();
    if (!modalData.name || !modalData.id) return;
    try {
      const res = await api.updateEnvironment(modalData.id, modalData.name, modalData.variables || {});
      if (res.error) throw new Error(res.error);
      setModalOpen(null);
      setModalData({});
      await loadData();
      showToast({ message: 'Environment updated!', type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateGlobals = (newGlobals) => {
    setGlobals(newGlobals);
    showToast({ message: 'Global variables updated', type: 'success' });
  };

  const handleDeleteEnvironment = async (id) => {
    const env = environments.find(e => e.id === id);
    setModalData({
      type: 'Environment',
      name: env?.name || 'Environment',
      onConfirm: async () => {
        try {
          const res = await api.deleteEnvironment(id);
          if (res.error) throw new Error(res.error);
          if (activeEnvId === id) setActiveEnvId('');
          await loadData();
          showToast({ message: 'Environment deleted', type: 'info' });
        } catch (err) {
          showToast({ message: err.message, type: 'error' });
        }
      }
    });
    setModalOpen('delete-confirm');
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!modalData.name || !modalData.collectionId) return;
    await api.createFolder(modalData.name, modalData.collectionId);
    setExpanded(prev => ({ ...prev, [modalData.collectionId]: true }));
    setModalOpen(null);
    setModalData({});
    loadData();
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!modalData.name || !modalData.collectionId) return;
    const newReq = await api.createRequest({
      name: modalData.name,
      method: modalData.method || 'GET',
      url: '{{baseUrl}}/',
      collectionId: modalData.collectionId,
      folderId: modalData.folderId || null
    });
    if (modalData.folderId) {
      setExpanded(prev => ({ ...prev, [modalData.folderId]: true, [modalData.collectionId]: true }));
    } else {
      setExpanded(prev => ({ ...prev, [modalData.collectionId]: true }));
    }
    setModalOpen(null);
    setModalData({});
    loadData();
    setActiveRequest(newReq);
  };

  const handleDeleteCollection = async (id, e) => {
    if (e) e.stopPropagation();
    const col = collections.find(c => c.id === id);
    setModalData({
      type: 'Collection',
      name: col?.name || 'Collection',
      message: 'This will permanently delete the collection and all requests inside.',
      onConfirm: async () => {
        await api.deleteCollection(id);
        if (activeRequest && activeRequest.collectionId === id) setActiveRequest(null);
        loadData();
        showToast({ message: 'Collection deleted', type: 'info' });
      }
    });
    setModalOpen('delete-confirm');
  };

  const handleUpdateCollectionName = async (id, name) => {
    if (!name) return;
    try {
      await api.updateCollection(id, name);
      loadData();
      showToast({ message: 'Collection renamed', type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteFolder = async (id, e) => {
    if (e) e.stopPropagation();
    const folder = folders.find(f => f.id === id);
    setModalData({
      type: 'Folder',
      name: folder?.name || 'Folder',
      message: 'This will delete the folder and all requests inside.',
      onConfirm: async () => {
        await api.deleteFolder(id);
        if (activeRequest && activeRequest.folderId === id) setActiveRequest(null);
        loadData();
        showToast({ message: 'Folder deleted', type: 'info' });
      }
    });
    setModalOpen('delete-confirm');
  };

  const handleUpdateFolderName = async (id, name) => {
    if (!name) return;
    try {
      await api.updateFolder(id, name);
      loadData();
      showToast({ message: 'Folder renamed', type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteRequest = async (id, e) => {
    if (e) e.stopPropagation();
    const req = requests.find(r => r.id === id);
    setModalData({
      type: 'Request',
      name: req?.name || 'Request',
      onConfirm: async () => {
        await api.deleteRequest(id);
        if (activeRequest && activeRequest.id === id) setActiveRequest(null);
        loadData();
        showToast({ message: 'Request deleted', type: 'info' });
      }
    });
    setModalOpen('delete-confirm');
  };

  const handleUpdateRequestName = async (id, name) => {
    if (!name) return;
    try {
      await api.updateRequest(id, { name });
      loadData();
      showToast({ message: 'Request renamed', type: 'success' });
    } catch (err) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleDuplicateRequest = async (req, e) => {
    e.stopPropagation();
    await api.createRequest({
      name: `${req.name} Copy`,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      auth: req.auth,
      collectionId: req.collectionId,
      folderId: req.folderId
    });
    loadData();
  };

  const handleSaveRequest = async () => {
    if (!activeRequest) return;
    await api.updateRequest(activeRequest.id, activeRequest);
    loadData();
    showToast({ message: 'Request saved', type: 'success' });
  };

  const handleCopyAsCurl = () => {
    if (!activeRequest) return;
    const activeEnv = environments.find(e => e.id === activeEnvId);
    const resolvedRequest = resolveRequestVariables(activeRequest, activeEnv, globals);
    const curl = generateCurl(resolvedRequest);
    navigator.clipboard.writeText(curl);
    showToast({ message: 'cURL copied!', type: 'info' });
  };

  const handleUrlPaste = (e) => {
    const text = e.clipboardData.getData('text');
    if (text && text.trim().toLowerCase().startsWith('curl')) {
      e.preventDefault();
      const parsed = parseCurl(text);
      if (parsed) {
        setActiveRequest(prev => ({
          ...prev,
          method: parsed.method,
          url: parsed.url,
          headers: parsed.headers.length > 0 ? parsed.headers : prev.headers,
          params: parsed.params.length > 0 ? parsed.params : prev.params,
          body: parsed.body || prev.body
        }));
        showToast({ message: 'cURL parsed successfully', type: 'success' });
      }
    }
  };

  const handleDragStart = (e, target) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(target);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== targetId) setDragOverId(targetId);
  };

  const handleDrop = async (e, dropTarget) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedItem || draggedItem.type !== 'request') return;
    const currentReq = requests.find(r => r.id === draggedItem.id);
    if (!currentReq) return;
    let updatePayload = { folderId: currentReq.folderId, collectionId: currentReq.collectionId };
    if (dropTarget.type === 'folder') {
      if (currentReq.folderId === dropTarget.id) return;
      updatePayload = { folderId: dropTarget.id, collectionId: dropTarget.collectionId };
    } else if (dropTarget.type === 'collection') {
      if (currentReq.collectionId === dropTarget.id && !currentReq.folderId) return;
      updatePayload = { folderId: null, collectionId: dropTarget.id };
    }
    setRequests(prev => prev.map(r => r.id === currentReq.id ? { ...r, ...updatePayload } : r));
    await api.updateRequest(currentReq.id, updatePayload);
    loadData();
    showToast({ message: 'Request moved', type: 'info' });
  };

  const handleExportCollection = (collection) => {
    const colRequests = requests.filter(r => r.collectionId === collection.id);
    const colFolders = folders.filter(f => f.collectionId === collection.id);
    const exportData = {
      collection_name: collection.name,
      version: "1.0",
      format: "APIForge",
      folders: colFolders.map(f => ({ id: f.id, name: f.name })),
      requests: colRequests.map(r => ({
        id: r.id, name: r.name, method: r.method, url: r.url,
        folderId: r.folderId, headers: r.headers, params: r.params,
        body: r.body, auth: r.auth
      }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name.replace(/\s+/g, '_')}_collection.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Collection exported', type: 'success' });
  };

  const handleImportCollection = async (e) => {
    e.preventDefault();
    const file = modalData.importFile;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Handle Postman Environment
        if (data._postman_variable_scope === 'environment' || (data.values && Array.isArray(data.values) && data.name && !data.item)) {
          console.log("Importing Postman environment:", data.name);
          const vars = {};
          (data.values || []).forEach(v => {
            if (v.key) vars[v.key] = v.value || '';
          });
          await api.createEnvironment(data.name || 'Imported Postman Env', vars);
          showToast({ message: `Environment '${data.name}' imported`, type: 'success' });
          loadData();
          setModalOpen(null);
          setModalData({});
          return;
        }

        const parsePostmanBody = (body) => {
          if (!body) return { type: 'none', content: '' };
          if (body.mode === 'raw') return { type: 'json', content: body.raw || '' };
          if (body.mode === 'formdata') {
            return { type: 'form-data', content: (body.formdata || []).map(f => ({ key: f.key, value: f.value, enabled: !f.disabled })) };
          }
          return { type: 'none', content: '' };
        };

        const parsePostmanHeaders = (headers) => {
          if (!headers || !Array.isArray(headers)) return [];
          return headers.map(h => ({
            key: h.key,
            value: h.value,
            enabled: !h.disabled,
            description: h.description || ''
          }));
        };

        const parsePostmanUrl = (url) => {
          if (typeof url === 'string') return url;
          if (url && url.raw) return url.raw;
          return '';
        };

        const parsePostmanParams = (url) => {
          if (!url || !url.query || !Array.isArray(url.query)) return [];
          return url.query.map(q => ({
            key: q.key,
            value: q.value,
            enabled: !q.disabled,
            description: q.description || ''
          }));
        };

        let importTree = {
          name: data.collection_name || data.info?.name || 'Imported Collection',
          userId: user.id,
          folders: [],
          requests: []
        };

        const processItems = (items, currentFolderName = null) => {
          items.forEach(item => {
            if (item.item) {
              // It's a folder
              const folderName = currentFolderName ? `${currentFolderName} / ${item.name}` : item.name;
              const folderRequests = [];
              const subItems = [];

              // We'll flatten internal folders for now
              const extractRequests = (subItemsList) => {
                subItemsList.forEach(si => {
                  if (si.request) {
                    folderRequests.push({
                      name: si.name,
                      method: si.request.method,
                      url: parsePostmanUrl(si.request.url),
                      headers: parsePostmanHeaders(si.request.header),
                      body: parsePostmanBody(si.request.body),
                      params: parsePostmanParams(si.request.url)
                    });
                  } else if (si.item) {
                    extractRequests(si.item);
                  }
                });
              };

              extractRequests(item.item);

              if (folderRequests.length > 0) {
                importTree.folders.push({
                  name: folderName,
                  requests: folderRequests
                });
              }
            } else if (item.request) {
              // It's a root request
              importTree.requests.push({
                name: item.name,
                method: item.request.method,
                url: parsePostmanUrl(item.request.url),
                headers: parsePostmanHeaders(item.request.header),
                body: parsePostmanBody(item.request.body),
                params: parsePostmanParams(item.request.url)
              });
            }
          });
        };

        if (data.item) {
          processItems(data.item);
        }

        await api.importCollection(importTree);
        setModalOpen(null);
        setModalData({});
        loadData();
        showToast({ message: 'Collection imported!', type: 'success' });
      } catch (err) {
        console.error("Import error:", err);
        showToast({ message: "Invalid format: " + err.message, type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleSendRequest = async () => {
    if (!activeRequest) return;
    setIsSending(true);
    setResponse(null);
    try {
      const activeEnv = environments.find(e => e.id === activeEnvId);
      const subRequest = resolveRequestVariables(activeRequest, activeEnv, globals);

      const res = await api.executeRequest({
        url: subRequest.url,
        method: subRequest.method,
        headers: subRequest.headers,
        params: subRequest.params,
        body: subRequest.body
      });
      setResponse(res);
    } catch (err) {
      setResponse({ status: 0, statusText: 'Error', time: 0, size: 0, data: err.message, headers: {} });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login onLoginSuccess={setUser} /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <Signup onSignupSuccess={setUser} /> : <Navigate to="/" />} />
      <Route path="/" element={user ? (
        <>
          <Dashboard
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            setModalOpen={setModalOpen}
            setModalData={setModalData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            tree={tree}
            toggleExpand={toggleExpand}
            handleExportCollection={handleExportCollection}
            handleDeleteCollection={handleDeleteCollection}
            handleDeleteFolder={handleDeleteFolder}
            handleDeleteRequest={handleDeleteRequest}
            handleDeleteEnvironment={handleDeleteEnvironment}
            handleDuplicateRequest={handleDuplicateRequest}
            handleUpdateCollectionName={handleUpdateCollectionName}
            handleUpdateFolderName={handleUpdateFolderName}
            handleUpdateRequestName={handleUpdateRequestName}
            handleUpdateWorkspaceName={handleUpdateWorkspaceName}
            activeRequest={activeRequest}
            setActiveRequest={setActiveRequest}
            globals={globals}
            handleUpdateGlobals={handleUpdateGlobals}
            activeEnvId={activeEnvId}
            setActiveEnvId={setActiveEnvId}
            environments={environments}
            expanded={expanded}
            dragOverId={dragOverId}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleDragStart={handleDragStart}
            theme={theme}
            setTheme={setTheme}
            handleLogout={handleLogout}
            handleSaveRequest={handleSaveRequest}
            handleCopyAsCurl={handleCopyAsCurl}
            handleUrlPaste={handleUrlPaste}
            isSending={isSending}
            response={response}
            editorTab={editorTab}
            setEditorTab={setEditorTab}
            handleSendRequest={handleSendRequest}
          />

          <Modals
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            modalData={modalData}
            setModalData={setModalData}
            handleCreateCollection={handleCreateCollection}
            handleCreateFolder={handleCreateFolder}
            handleCreateRequest={handleCreateRequest}
            handleImportCollection={handleImportCollection}
            handleCreateWorkspace={handleCreateWorkspace}
            handleWorkspaceChange={handleWorkspaceChange}
            collections={collections}
            folders={folders}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            handleDeleteWorkspace={handleDeleteWorkspace}
            handleInviteMember={handleInviteMember}
            workspaceMembers={workspaceMembers}
            fetchMembers={fetchMembers}
            handleRemoveMember={handleRemoveMember}
            currentUser={user}
            pendingInvitations={pendingInvitations}
            handleRespondToInvitation={handleRespondToInvitation}
            fetchInvitations={fetchInvitations}
            handleCreateEnvironment={handleCreateEnvironment}
            handleUpdateEnvironment={handleUpdateEnvironment}
            globals={globals}
            handleUpdateGlobals={handleUpdateGlobals}
          />
        </>
      ) : <Navigate to="/login" />} />
    </Routes>
  );
}
