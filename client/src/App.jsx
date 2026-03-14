import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, FolderOpen, Play, Copy, Trash2, Plus, GripVertical, 
  ChevronRight, ChevronDown, Download, Upload, Server, Clock, 
  Search, X, Save, Box, History, Link, Sun, Moon
} from 'lucide-react';
import { api } from './api';
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
  
  const [activeTab, setActiveTab] = useState('collections'); // collections, history, environments
  const [expanded, setExpanded] = useState({}); // { [id]: boolean }
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeEnvId, setActiveEnvId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Tabs
  const [editorTab, setEditorTab] = useState('params'); // params, headers, body, auth
  const [response, setResponse] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Modals
  const [modalOpen, setModalOpen] = useState(null); // 'collection', 'folder', 'request', 'import', 'workspace', 'login', 'signup'
  const [modalData, setModalData] = useState({});
  const [theme, setTheme] = useState('dark');

  // Auth & Workspaces
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => localStorage.getItem('activeWorkspaceId') || '');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Drag & Drop
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'request', id }
  const [dragOverId, setDragOverId] = useState(null);

  // Load Data
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
      setCollections(cols);
      setFolders(flds);
      setRequests(reqs);
      setEnvironments(envs);
      setWorkspaces(wks);

      if (wks.length > 0 && !activeWorkspaceId) {
        handleWorkspaceChange(wks[0].id);
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes('Unauthorized')) handleLogout();
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user, activeWorkspaceId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(modalData.email, modalData.password);
      if (res.error) throw new Error(res.error);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      setModalOpen(null);
      setModalData({});
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.signup(modalData.name, modalData.email, modalData.password);
      if (res.error) throw new Error(res.error);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      setModalOpen(null);
      setModalData({});
    } catch (err) {
      alert(err.message);
    }
  };

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

  // Derived Tree based on search
  const tree = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!Array.isArray(collections)) return [];
    return collections.map(col => {
      // Find folders for this collection
      const colFolders = folders.filter(f => f.collectionId === col.id).map(f => {
        const folderReqs = requests.filter(r => r.folderId === f.id);
        const filteredReqs = folderReqs.filter(r => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
        return { ...f, requests: filteredReqs, match: f.name.toLowerCase().includes(q) || filteredReqs.length > 0 };
      });
      
      const filteredFolders = colFolders.filter(f => f.match);
      
      // Standalone requests
      const standaloneReqs = requests.filter(r => r.collectionId === col.id && (!r.folderId || r.folderId === ''));
      const filteredStandalone = standaloneReqs.filter(r => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
      
      const match = col.name.toLowerCase().includes(q) || filteredFolders.length > 0 || filteredStandalone.length > 0;
      
      return { 
        ...col, 
        folders: filteredFolders, 
        requests: filteredStandalone,
        match 
      };
    }).filter(col => col.match);
  }, [collections, folders, requests, searchQuery]);

  // Toggle Expanse
  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- ACTIONS ---

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
    if (confirm('Delete collection and all contents?')) {
      await api.deleteCollection(id);
      if (activeRequest && activeRequest.collectionId === id) setActiveRequest(null);
      loadData();
    }
  };

  const handleDeleteFolder = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete folder and all requests inside?')) {
      await api.deleteFolder(id);
      if (activeRequest && activeRequest.folderId === id) setActiveRequest(null);
      loadData();
    }
  };

  const handleDeleteRequest = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete request?')) {
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

  // --- DRAG AND DROP ---
  
  const handleDragStart = (e, target) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(target);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== targetId) {
      setDragOverId(targetId);
    }
  };

  const handleDrop = async (e, dropTarget) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedItem || draggedItem.type !== 'request') return;

    // dropTarget = { type: 'folder' | 'collection', id: folderId | collectionId, collectionId?: string }
    const currentReq = requests.find(r => r.id === draggedItem.id);
    if (!currentReq) return;

    let updatePayload = { folderId: currentReq.folderId, collectionId: currentReq.collectionId };

    if (dropTarget.type === 'folder') {
      if (currentReq.folderId === dropTarget.id) return; // No change
      updatePayload = { folderId: dropTarget.id, collectionId: dropTarget.collectionId };
    } else if (dropTarget.type === 'collection') {
      if (currentReq.collectionId === dropTarget.id && !currentReq.folderId) return; // No change
      updatePayload = { folderId: null, collectionId: dropTarget.id };
    }

    // Optimistic UI update
    setRequests(prev => prev.map(r => r.id === currentReq.id ? { ...r, ...updatePayload } : r));
    
    // Server update
    await api.updateRequest(currentReq.id, updatePayload);
    loadData();
  };

  // --- EXPORT / IMPORT ---

  const handleExportCollection = (collection) => {
    const colRequests = requests.filter(r => r.collectionId === collection.id);
    const colFolders = folders.filter(f => f.collectionId === collection.id);

    const exportData = {
      collection_name: collection.name,
      version: "1.0",
      format: "APIForge",
      folders: colFolders.map(f => ({
        id: f.id,
        name: f.name
      })),
      requests: colRequests.map(r => ({
        id: r.id,
        name: r.name,
        method: r.method,
        url: r.url,
        folderId: r.folderId,
        headers: r.headers,
        params: r.params,
        body: r.body,
        auth: r.auth
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
          userId: 'user_1',
          folders: [],
          requests: []
        };

        // Support native export format or Postman basic
        if (data.format === 'APIForge' || data.version === '1.0') {
          // Native format transformation
          const folderMap = {};
          if (data.folders) {
            importTree.folders = data.folders.map(f => {
              folderMap[f.id] = f.name;
              return { name: f.name, requests: [] };
            });
          }
          if (data.requests) {
            data.requests.forEach(r => {
              const req = { ...r };
              if (r.folderId && folderMap[r.folderId]) {
                const folder = importTree.folders.find(f => f.name === folderMap[r.folderId]);
                if (folder) folder.requests.push(req);
              } else {
                importTree.requests.push(req);
              }
            });
          }
        } 
        else if (data.info && data.info.schema && data.info.schema.includes('postman')) {
          // Postman v2 transformation
          const parsePostmanItem = (item) => {
            if (item.item) {
              // It's a folder
              const folder = {
                name: item.name,
                requests: item.item.filter(i => i.request).map(i => parsePostmanRequest(i))
              };
              // Note: This simple version doesn't support nested folders since the server ImportTree is flat
              // We'll flatten nested folders for now or just take the first level
              return folder;
            }
            return null;
          };

          const parsePostmanRequest = (item) => {
            const reqData = item.request;
            let parsedUrl = '';
            let parsedParams = [];
            
            if (typeof reqData.url === 'string') {
              parsedUrl = reqData.url;
            } else if (typeof reqData.url === 'object' && reqData.url !== null) {
              parsedUrl = reqData.url.raw || '';
              if (Array.isArray(reqData.url.query)) {
                parsedParams = reqData.url.query.map(q => ({ key: q.key || '', value: q.value || '', description: q.description || '' }));
              }
            }
            
            let parsedHeaders = [];
            if (Array.isArray(reqData.header)) {
              parsedHeaders = reqData.header.map(h => ({ key: h.key || '', value: h.value || '', description: h.description || '' }));
            }
            
            let parsedBody = null;
            if (reqData.body && reqData.body.mode) {
              if (reqData.body.mode === 'raw') {
                parsedBody = { type: 'json', content: reqData.body.raw };
              }
            }

            return {
              name: item.name,
              method: reqData.method || 'GET',
              url: parsedUrl,
              headers: parsedHeaders,
              params: parsedParams,
              body: parsedBody
            };
          };

          // Flattening postman items into folders and root requests
          if (data.item) {
            data.item.forEach(item => {
              if (item.item) {
                importTree.folders.push(parsePostmanItem(item));
              } else if (item.request) {
                importTree.requests.push(parsePostmanRequest(item));
              }
            });
          }
        }

        await api.importCollection(importTree);
        setModalOpen(null);
        setModalData({});
        loadData();
      } catch (err) {
        console.error(err);
        alert("Invalid format: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportEnv = (env) => {
    const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${env.name}_env.json`;
    a.click();
  };

  // --- RENDERERS ---

  const renderRequestEditor = () => {
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
        const subHeaders = (activeRequest.headers || []).map(h => ({
          ...h, value: replaceVars(h.value)
        }));
        const subParams = (activeRequest.params || []).map(p => ({
          ...p, value: replaceVars(p.value)
        }));
        
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
                placeholder="Enter URL or paste text"
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
          {editorTab === 'params' && renderKvTable('params')}
          {editorTab === 'headers' && renderKvTable('headers')}
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

  const renderKvTable = (field) => {
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
  }

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <img src="/logo.png" alt="Logo" style={{height: '48px', marginBottom: '16px'}} />
          <h1>Welcome to RequestLab</h1>
          <p>Collaborative API Client</p>
          <div style={{display: 'flex', gap: '12px', marginTop: '24px', width: '100%'}}>
            <button className="btn-primary" style={{flex: 1}} onClick={() => setModalOpen('login')}>Log In</button>
            <button className="btn-secondary" style={{flex: 1}} onClick={() => setModalOpen('signup')}>Sign Up</button>
          </div>
        </div>

        {modalOpen === 'login' && (
          <div className="modal-overlay" onClick={() => setModalOpen(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Log In</h3>
                <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
              </div>
              <form onSubmit={handleLogin}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" required value={modalData.email || ''} onChange={e => setModalData({...modalData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" required value={modalData.password || ''} onChange={e => setModalData({...modalData, password: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn-primary">Log In</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalOpen === 'signup' && (
          <div className="modal-overlay" onClick={() => setModalOpen(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Sign Up</h3>
                <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
              </div>
              <form onSubmit={handleSignup}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" required value={modalData.email || ''} onChange={e => setModalData({...modalData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" required value={modalData.password || ''} onChange={e => setModalData({...modalData, password: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn-primary">Sign Up</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
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
           <div className="user-profile" title={user.name}>
             {user.name.charAt(0).toUpperCase()}
           </div>
          <div className="nav-item" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>Theme</span>
          </div>
          <div className="nav-item" onClick={handleLogout} title="Logout">
            <X size={20} />
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
          <Search />
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
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setModalData({collectionId: col.id}); setModalOpen('folder'); }} title="New Folder"><Folder size={14} /></button>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setModalData({collectionId: col.id}); setModalOpen('request'); }} title="New Request"><Plus size={14} /></button>
                  <button className="icon-btn" onClick={(e) => handleDeleteCollection(col.id, e)}><Trash2 size={14} /></button>
                </div>
              </div>

              {expanded[col.id] && (
                <div>
                  {/* Folders */}
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
                          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setModalData({collectionId: col.id, folderId: folder.id}); setModalOpen('request'); }} title="New Request"><Plus size={14} /></button>
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

                  {/* Standalone Requests */}
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

          {activeTab === 'environments' && (
            <div className="empty-state" style={{flex: 'unset', padding: '40px 0'}}>
              <Server size={32} />
              <p>Environments</p>
            </div>
          )}
        </div>
      </div>

      {/* MAIN PANEL */}
      <div className="main-panel">
        {renderRequestEditor()}
      </div>

      {/* MODALS */}
      {modalOpen === 'collection' && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Collection</h3>
              <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreateCollection}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Collection Name</label>
                  <input autoFocus required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="e.g. User APIs" />
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
              <h3>Create Folder</h3>
              <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Folder Name</label>
                  <input autoFocus required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="e.g. Auth" />
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
              <h3>Create Request</h3>
              <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Request Name</label>
                  <input autoFocus required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="e.g. Get Users" />
                </div>
                <div className="form-group">
                  <label>Method</label>
                  <select 
                    style={{padding: '10px 12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px'}}
                    value={modalData.method || 'GET'} 
                    onChange={e => setModalData({...modalData, method: e.target.value})}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
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
                  <label>JSON File</label>
                  <input type="file" accept=".json" onChange={e => setModalData({...modalData, importFile: e.target.files[0]})} />
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px'}}>
                    Supports Postman Collection v2 and APIForge formats.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!modalData.importFile}>Import</button>
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

    </div>
  );
}
