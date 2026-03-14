import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/dashboard/Dashboard';
import Modals from './components/dashboard/Modals';
import { generateCurl, parseCurl } from './utils/curlUtils';
import './index.css';

// Helpers
const parseJSONStr = (str, fallback) => {
  try { return JSON.parse(str); } catch (e) { return fallback; }
};

export default function App() {
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [cols, flds, reqs, envs, wks] = await Promise.all([
        api.getCollections(),
        api.getFolders(),
        api.getAllRequests(),
        api.getEnvironments(),
        api.getWorkspaces()
      ]);
      setCollections(cols || []);
      setFolders(flds || []);
      setRequests(reqs || []);
      setEnvironments(envs || []);
      setWorkspaces(wks || []);

      if (wks && wks.length > 0 && !activeWorkspaceId) {
        handleWorkspaceChange(wks[0].id);
      }
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('Unauthorized')) handleLogout();
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user, activeWorkspaceId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeWorkspaceId');
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceId('');
    setCollections([]);
    setFolders([]);
    setRequests([]);
    setActiveRequest(null);
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
      loadData();
      handleWorkspaceChange(res.id);
    } catch (err) {
      alert(err.message);
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
    e.stopPropagation();
    if (window.confirm('Delete collection and all contents?')) {
      await api.deleteCollection(id);
      if (activeRequest && activeRequest.collectionId === id) setActiveRequest(null);
      loadData();
    }
  };

  const handleDeleteFolder = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete folder and all requests inside?')) {
      await api.deleteFolder(id);
      if (activeRequest && activeRequest.folderId === id) setActiveRequest(null);
      loadData();
    }
  };

  const handleDeleteRequest = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete request?')) {
      await api.deleteRequest(id);
      if (activeRequest && activeRequest.id === id) setActiveRequest(null);
      loadData();
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
    alert('Request saved');
  };

  const handleCopyAsCurl = () => {
    if (!activeRequest) return;
    const curl = generateCurl(activeRequest);
    navigator.clipboard.writeText(curl);
    alert('cURL command copied to clipboard');
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
  };

  const handleImportCollection = async (e) => {
    e.preventDefault();
    const file = modalData.importFile;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        let importTree = {
          name: data.collection_name || data.info?.name || 'Imported Collection',
          userId: user.id || 'user_1',
          folders: [],
          requests: []
        };
        await api.importCollection(importTree);
        setModalOpen(null);
        setModalData({});
        loadData();
      } catch (err) {
        alert("Invalid format: " + err.message);
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
      const replaceVars = (str) => {
        if (!str || typeof str !== 'string') return str;
        let res = str;
        if (activeEnv && activeEnv.variables) {
          Object.entries(activeEnv.variables).forEach(([k, v]) => {
            res = res.replace(new RegExp(`{{${k}}}`, 'g'), v);
          });
        }
        return res;
      };
      const subUrl = replaceVars(activeRequest.url);
      const subHeaders = (activeRequest.headers || []).map(h => ({ ...h, value: replaceVars(h.value) }));
      const subParams = (activeRequest.params || []).map(p => ({ ...p, value: replaceVars(p.value) }));
      let subBody = activeRequest.body;
      if (subBody && subBody.type === 'json' && subBody.content) {
        subBody = { ...subBody, content: replaceVars(subBody.content) };
      }
      const res = await api.executeRequest({
        url: subUrl,
        method: activeRequest.method,
        headers: subHeaders,
        params: subParams,
        body: subBody
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
            environments={environments}
            activeEnvId={activeEnvId}
            setActiveEnvId={setActiveEnvId}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            setModalOpen={setModalOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            tree={tree}
            toggleExpand={toggleExpand}
            handleExportCollection={handleExportCollection}
            handleDeleteCollection={handleDeleteCollection}
            handleDeleteFolder={handleDeleteFolder}
            handleDeleteRequest={handleDeleteRequest}
            handleDuplicateRequest={handleDuplicateRequest}
            activeRequest={activeRequest}
            setActiveRequest={setActiveRequest}
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
          />
        </>
      ) : <Navigate to="/login" />} />
    </Routes>
  );
}
