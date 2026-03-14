import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, FolderOpen, Play, Copy, Trash2, Plus, 
  ChevronRight, ChevronDown, Download, Server, 
  Search, X, Save, Box, History, Link as LucideLink, Sun, Moon
} from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
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
        // Basic Postman/Native import logic... (keeping it simple for now)
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

          {/* MODALS */}
          {modalOpen === 'collection' && (
            <div className="modal-overlay" onClick={() => setModalOpen(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>New Collection</h3>
                  <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
                </div>
                <form onSubmit={handleCreateCollection}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Name</label>
                      <input autoFocus required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="e.g. My Website API" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
                    <button type="submit" className="btn-primary">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {modalOpen === 'folder' && (
            <div className="modal-overlay" onClick={() => setModalOpen(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>New Folder</h3>
                  <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
                </div>
                <form onSubmit={handleCreateFolder}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Collection</label>
                      <select required value={modalData.collectionId || ''} onChange={e => setModalData({...modalData, collectionId: e.target.value})}>
                        <option value="">Select Collection</option>
                        {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input autoFocus required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="e.g. Authentication" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
                    <button type="submit" className="btn-primary">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {modalOpen === 'request' && (
            <div className="modal-overlay" onClick={() => setModalOpen(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>New Request</h3>
                  <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
                </div>
                <form onSubmit={handleCreateRequest}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Collection</label>
                      <select required value={modalData.collectionId || ''} onChange={e => setModalData({...modalData, collectionId: e.target.value})}>
                        <option value="">Select Collection</option>
                        {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Folder (Optional)</label>
                      <select value={modalData.folderId || ''} onChange={e => setModalData({...modalData, folderId: e.target.value})}>
                        <option value="">Root</option>
                        {folders.filter(f => f.collectionId === modalData.collectionId).map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Method</label>
                      <select value={modalData.method || 'GET'} onChange={e => setModalData({...modalData, method: e.target.value})}>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input autoFocus required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="e.g. Login Request" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
                    <button type="submit" className="btn-primary">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {modalOpen === 'import' && (
            <div className="modal-overlay" onClick={() => setModalOpen(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Import Collection</h3>
                  <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
                </div>
                <form onSubmit={handleImportCollection}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>JSON File (Postman v2.1 or APIForge)</label>
                      <input type="file" required onChange={e => setModalData({...modalData, importFile: e.target.files[0]})} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
                    <button type="submit" className="btn-primary">Import</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {modalOpen === 'workspace' && (
            <div className="modal-overlay" onClick={() => setModalOpen(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Create Workspace</h3>
                  <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
                </div>
                <form onSubmit={handleCreateWorkspace}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Workspace Name</label>
                      <input autoFocus required value={modalData.workspaceName || ''} onChange={e => setModalData({...modalData, workspaceName: e.target.value})} placeholder="e.g. Project Alpha" />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select 
                        style={{padding: '10px 12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px'}}
                        value={modalData.workspaceType || 'personal'} 
                        onChange={e => setModalData({...modalData, workspaceType: e.target.value})}
                      >
                        <option value="personal">Personal</option>
                        <option value="team">Team</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
                    <button type="submit" className="btn-primary">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {modalOpen === 'workspace-switch' && (
            <div className="modal-overlay" onClick={() => setModalOpen(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Switch Workspace</h3>
                  <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
                </div>
                <div className="modal-body" style={{padding: '8px'}}>
                  {workspaces.map(w => (
                    <div 
                      key={w.id} 
                      className={`workspace-option ${w.id === activeWorkspaceId ? 'active' : ''}`}
                      onClick={() => { handleWorkspaceChange(w.id); setModalOpen(null); }}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div className="workspace-icon">
                          {w.type === 'team' ? <Box size={14} /> : <Box size={14} />}
                        </div>
                        <div>
                          <div style={{fontWeight: 500}}>{w.name}</div>
                          <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>{w.type}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : <Navigate to="/login" />} />
    </Routes>
  );
}

// --- SUB-COMPONENTS ---

const KvTable = ({ field, activeRequest, setActiveRequest }) => {
  const items = [...(activeRequest[field] || []), { key: '', value: '', description: '' }];
  return (
    <table className="kv-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
          <th>Description</th>
          <th style={{width: '40px'}}></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx}>
            <td><input 
              placeholder="Key" 
              value={item.key} 
              onChange={(e) => {
                const newItems = [...(activeRequest[field] || [])];
                if (!newItems[idx]) newItems[idx] = { key: '', value: '' };
                newItems[idx].key = e.target.value;
                setActiveRequest(prev => ({ ...prev, [field]: newItems.filter(i => i.key || i.value) }));
              }}
            /></td>
            <td><input 
              placeholder="Value" 
              value={item.value}
              onChange={(e) => {
                const newItems = [...(activeRequest[field] || [])];
                if (!newItems[idx]) newItems[idx] = { key: '', value: '' };
                newItems[idx].value = e.target.value;
                setActiveRequest(prev => ({ ...prev, [field]: newItems.filter(i => i.key || i.value) }));
              }}
            /></td>
            <td><input placeholder="Description" value={item.description || ''} onChange={()=>{}}/></td>
            <td style={{textAlign: 'center'}}>
              {idx < items.length - 1 && 
                <button className="icon-btn" onClick={() => {
                   const newItems = [...(activeRequest[field] || [])];
                   newItems.splice(idx, 1);
                   setActiveRequest(prev => ({ ...prev, [field]: newItems }));
                }}><Trash2 size={14}/></button>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const RequestEditor = ({ 
  activeRequest, 
  setActiveRequest,
  environments, 
  activeEnvId, 
  setActiveEnvId, 
  handleSaveRequest, 
  handleCopyAsCurl, 
  handleUrlPaste, 
  handleSendRequest,
  isSending,
  response,
  editorTab,
  setEditorTab
}) => {
  if (!activeRequest) {
    return (
      <div className="empty-state">
        <Play size={48} />
        <h2>Open a request from the sidebar</h2>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setActiveRequest(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="request-editor">
      <div className="editor-header">
        <div className="request-title-bar">
          <h3>{activeRequest.name}</h3>
          <div style={{display: 'flex', gap: '8px'}}>
            <select 
              style={{padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none'}}
              value={activeEnvId}
              onChange={e => setActiveEnvId(e.target.value)}
            >
              <option value="">No environment</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
            <button className="icon-btn" style={{border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px'}} onClick={handleCopyAsCurl} title="Copy as cURL">
              <Copy size={14} /> cURL
            </button>
            <button className="icon-btn" style={{border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px'}} onClick={handleSaveRequest} title="Save">
              <Save size={14} /> Save
            </button>
          </div>
        </div>
        <div className="request-url-bar">
          <div className="url-input-container">
            <select 
              className={`method-select method-${activeRequest.method}`}
              value={activeRequest.method}
              onChange={(e) => handleChange('method', e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input 
              className="url-input" 
              value={activeRequest.url}
              onChange={(e) => handleChange('url', e.target.value)} 
              onPaste={handleUrlPaste}
              placeholder="Enter URL or paste cURL"
            />
          </div>
          <button className="btn-primary" onClick={handleSendRequest} disabled={isSending}>
             {isSending ? 'Sending...' : 'Send'} <ChevronDown size={14} style={{marginLeft: '4px'}}/>
          </button>
        </div>
      </div>

      <div className="editor-tabs">
        {['params', 'headers', 'body', 'auth'].map(t => (
          <button 
            key={t}
            className={`editor-tab ${editorTab === t ? 'active' : ''}`}
            onClick={() => setEditorTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {activeRequest[t] && activeRequest[t].length > 0 && 
              <span style={{marginLeft: '6px', color: 'var(--accent-color)'}}>•</span>}
          </button>
        ))}
      </div>

      <div className="editor-content">
        {editorTab === 'params' && <KvTable field="params" activeRequest={activeRequest} setActiveRequest={setActiveRequest} />}
        {editorTab === 'headers' && <KvTable field="headers" activeRequest={activeRequest} setActiveRequest={setActiveRequest} />}
        {editorTab === 'body' && (
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
              <label style={{color:'var(--text-secondary)', fontSize:'0.875rem'}}>Body Type:</label>
              <select 
                style={{background:'var(--bg-secondary)', color:'var(--text-primary)', border:'1px solid var(--border-color)', borderRadius:'4px', padding:'4px 8px'}}
                value={activeRequest.body?.type || 'none'}
                onChange={(e) => handleChange('body', { ...activeRequest.body, type: e.target.value })}
              >
                <option value="none">none</option>
                <option value="json">JSON</option>
                <option value="form-data">form-data</option>
              </select>
            </div>
            {activeRequest.body?.type === 'json' && (
              <textarea 
                className="code-editor"
                value={activeRequest.body?.content || ''}
                onChange={(e) => handleChange('body', { ...activeRequest.body, content: e.target.value })}
                placeholder="{}"
              />
            )}
          </div>
        )}
        {editorTab === 'auth' && (
          <div className="empty-state" style={{flex: 'unset', padding: '40px 0'}}>
            Auth configuration not implemented in this demo.
          </div>
        )}
      </div>

      <div className="response-pane">
        <div className="response-pane-header">
          <h4>Response</h4>
          {response && (
            <div className="response-stats">
              <span>Status: <strong style={{ color: response.status >= 200 && response.status < 300 ? 'var(--success)' : 'var(--danger)' }}>{response.status} {response.statusText}</strong></span>
              <span>Time: <strong>{response.time} ms</strong></span>
              <span>Size: <strong>{response.size ? (response.size / 1024).toFixed(2) : 0} KB</strong></span>
            </div>
          )}
        </div>
        <div className="response-body">
          {isSending ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>Sending request...</div>
          ) : response ? (
            <pre>
              {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
            </pre>
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <span style={{fontSize: '48px'}}>🚀</span>
              <span>Enter the URL and click Send to get a response</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({
  user,
  activeTab,
  setActiveTab,
  environments,
  activeEnvId,
  setActiveEnvId,
  workspaces,
  activeWorkspaceId,
  setModalOpen,
  searchQuery,
  setSearchQuery,
  tree,
  toggleExpand,
  handleExportCollection,
  handleDeleteCollection,
  handleDeleteFolder,
  handleDeleteRequest,
  handleDuplicateRequest,
  activeRequest,
  setActiveRequest,
  expanded,
  dragOverId,
  handleDragOver,
  handleDrop,
  handleDragStart,
  theme,
  setTheme,
  handleLogout,
  handleSaveRequest,
  handleCopyAsCurl,
  handleUrlPaste,
  isSending,
  response,
  editorTab,
  setEditorTab,
  handleSendRequest
}) => (
  <div className="app-container">
    {/* THIN NAV BAR */}
    <div className="nav-bar">
      <div style={{display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', alignItems: 'center'}}>
        <div className={`nav-item ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => setActiveTab('collections')}>
          <Box size={20} />
          <span>Collections</span>
        </div>
        <div className={`nav-item ${activeTab === 'environments' ? 'active' : ''}`} onClick={() => setActiveTab('environments')}>
          <Server size={20} />
          <span>Environments</span>
        </div>
        <div className="nav-item">
          <History size={20} />
          <span>History</span>
        </div>
      </div>
      <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', alignItems: 'center'}}>
         {user && (
           <div className="user-profile" title={user.name}>
             {user.name.charAt(0).toUpperCase()}
           </div>
         )}
        <div className="nav-item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>Theme</span>
        </div>
        <div className="nav-item" onClick={handleLogout} title="Logout">
          <LucideLink size={20} />
          <span>Logout</span>
        </div>
      </div>
    </div>

    {/* SIDEBAR */}
    <div className="sidebar">
      <div className="sidebar-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '12px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', width: '100%'}}>
          <div className="workspace-selector" onClick={() => setModalOpen('workspace-switch')}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}}>
              <Box size={16} />
              <span style={{fontWeight: 600, fontSize: '14px'}}>{workspaces.find(w => w.id === activeWorkspaceId)?.name || 'Select Workspace'}</span>
            </div>
            <ChevronDown size={14} />
          </div>
          <button className="icon-btn" onClick={() => setModalOpen('workspace')} title="New Workspace"><Plus size={18} /></button>
        </div>
        
        <div style={{display: 'flex', gap: '4px', width: '100%'}}>
          <button className="btn-secondary" onClick={() => setModalOpen('collection')} style={{flex: 1, padding: '4px 8px'}}><Plus size={14} /> New</button>
          <button className="btn-secondary" onClick={() => setModalOpen('import')} style={{flex: 1, padding: '4px 8px'}}>Import</button>
        </div>
      </div>

      <div className="search-bar">
        <Search size={14} />
        <input 
          placeholder="Search collections" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sidebar-content">
        {activeTab === 'collections' && tree.map(col => (
          <div key={col.id} className="collection-item">
            <div 
              className={`collection-header ${dragOverId === `col-${col.id}` ? 'drag-over' : ''}`}
              onClick={() => toggleExpand(col.id)}
              onDragOver={(e) => handleDragOver(e, `col-${col.id}`)}
              onDrop={(e) => handleDrop(e, { type: 'collection', id: col.id })}
            >
              {expanded[col.id] ? <ChevronDown size={16} style={{marginRight: '8px', color: 'var(--text-secondary)'}}/> : <ChevronRight size={16} style={{marginRight: '8px', color: 'var(--text-secondary)'}}/>}
              <span style={{flex: 1}}>{col.name}</span>
              <div className="item-actions">
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleExportCollection(col); }} title="Export"><Download size={14} /></button>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setModalOpen('folder'); }} title="New Folder"><Folder size={14} /></button>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setModalOpen('request'); }} title="New Request"><Plus size={14} /></button>
                <button className="icon-btn" onClick={(e) => handleDeleteCollection(col.id, e)}><Trash2 size={14} /></button>
              </div>
            </div>

            {expanded[col.id] && (
              <div>
                {col.folders.map(folder => (
                  <div key={folder.id}>
                    <div 
                      className={`folder-header ${dragOverId === `fld-${folder.id}` ? 'drag-over' : ''}`}
                      onClick={() => toggleExpand(folder.id)}
                      onDragOver={(e) => handleDragOver(e, `fld-${folder.id}`)}
                      onDrop={(e) => handleDrop(e, { type: 'folder', id: folder.id, collectionId: col.id })}
                    >
                      {expanded[folder.id] ? <FolderOpen size={14} style={{marginRight: '8px'}}/> : <Folder size={14} style={{marginRight: '8px'}}/>}
                      <span style={{flex: 1}}>{folder.name}</span>
                      <div className="item-actions">
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setModalOpen('request'); }} title="New Request"><Plus size={14} /></button>
                        <button className="icon-btn" onClick={(e) => handleDeleteFolder(folder.id, e)}><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {expanded[folder.id] && folder.requests.map(req => (
                      <div 
                        key={req.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, { type: 'request', id: req.id })}
                        className={`request-item ${activeRequest?.id === req.id ? 'active' : ''}`}
                        onClick={() => setActiveRequest(req)}
                      >
                        <span className={`method-badge method-${req.method}`}>{req.method}</span>
                        <div className="name-wrapper">
                          <span>{req.name}</span>
                        </div>
                        <div className="item-actions">
                          <button className="icon-btn" onClick={(e) => handleDuplicateRequest(req, e)} title="Duplicate"><Copy size={14} /></button>
                          <button className="icon-btn" onClick={(e) => handleDeleteRequest(req.id, e)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {col.requests.map(req => (
                  <div 
                    key={req.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, { type: 'request', id: req.id })}
                    className={`request-item standalone-in-collection ${activeRequest?.id === req.id ? 'active' : ''}`}
                    onClick={() => setActiveRequest(req)}
                  >
                    <span className={`method-badge method-${req.method}`}>{req.method}</span>
                    <div className="name-wrapper">
                      <span>{req.name}</span>
                    </div>
                    <div className="item-actions">
                      <button className="icon-btn" onClick={(e) => handleDuplicateRequest(req, e)} title="Duplicate"><Copy size={14} /></button>
                      <button className="icon-btn" onClick={(e) => handleDeleteRequest(req.id, e)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* MAIN PANEL */}
    <div className="main-panel">
      <RequestEditor 
        activeRequest={activeRequest}
        setActiveRequest={setActiveRequest}
        environments={environments}
        activeEnvId={activeEnvId}
        setActiveEnvId={setActiveEnvId}
        handleSaveRequest={handleSaveRequest}
        handleCopyAsCurl={handleCopyAsCurl}
        handleUrlPaste={handleUrlPaste}
        handleSendRequest={handleSendRequest}
        isSending={isSending}
        response={response}
        editorTab={editorTab}
        setEditorTab={setEditorTab}
      />
    </div>
  </div>
);
