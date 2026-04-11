import { 
  Folder, FolderOpen, Copy, Trash2, Plus, 
  ChevronRight, ChevronDown, Download, Server, 
  Search, Box, History, Link as LucideLink, Sun, Moon, Edit3
} from 'lucide-react';
import RequestEditor from './RequestEditor';
import ActivityLogs from './ActivityLogs';
import EditableText from '../common/EditableText';

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
  setModalData,
  searchQuery,
  setSearchQuery,
  tree,
  toggleExpand,
  handleExportCollection,
  handleDeleteCollection,
  handleDeleteFolder,
  handleDeleteRequest,
  handleDeleteEnvironment,
  handleDuplicateRequest,
  globals,
  handleUpdateGlobals,
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
  handleUpdateCollectionName,
  handleUpdateFolderName,
  handleUpdateRequestName,
  handleUpdateWorkspaceName,
  handleSendRequest
}) => {
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const isAdmin = activeWorkspace?.role === 'admin';

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
        <div className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          <History size={20} />
          <span>Activity</span>
        </div>
      </div>
      <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', alignItems: 'center'}}>
         {user && (
           <div className="user-profile" title={user.name}>
             {user.avatarUrl ? (
               <img 
                 src={user.avatarUrl} 
                 alt={user.name} 
                 style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
               />
             ) : (
               user.name.charAt(0).toUpperCase()
             )}
           </div>
         )}
        <div className="nav-item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>Theme</span>
        </div>
        <div className="nav-item" onClick={() => handleLogout()} title="Logout">
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
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden'}}>
              <Box size={16} style={{ flexShrink: 0 }} />
              {isAdmin ? (
                <div style={{ flex: 1, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                  <EditableText 
                    text={activeWorkspace?.name || 'Select Workspace'} 
                    onSave={(newName) => handleUpdateWorkspaceName(activeWorkspaceId, newName)}
                    style={{ fontWeight: 600, fontSize: '14px' }}
                  />
                </div>
              ) : (
                <span style={{fontWeight: 600, fontSize: '14px'}}>{activeWorkspace?.name || 'Select Workspace'}</span>
              )}
            </div>
            <ChevronDown size={14} style={{ flexShrink: 0 }} />
          </div>
          <button className="icon-btn" onClick={() => setModalOpen('workspace')} title="New Workspace"><Plus size={18} /></button>
        </div>
        
        <div style={{display: 'flex', gap: '4px', width: '100%'}}>
          <button className="btn-secondary" onClick={() => { setModalData({}); setModalOpen(activeTab === 'collections' ? 'collection' : 'environment'); }} style={{flex: 1, padding: '4px 8px'}}><Plus size={14} /> New</button>
          {activeTab === 'collections' && <button className="btn-secondary" onClick={() => { setModalData({}); setModalOpen('import'); }} style={{flex: 1, padding: '4px 8px'}}>Import</button>}
        </div>
      </div>

      <div className="search-bar">
        <Search size={14} />
        <input 
          placeholder={activeTab === 'collections' ? "Search collections" : "Search environments"} 
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
              <EditableText 
                text={col.name} 
                onSave={(newName) => handleUpdateCollectionName(col.id, newName)}
                style={{ flex: 1, fontWeight: 500 }}
              />
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
                      <EditableText 
                        text={folder.name} 
                        onSave={(newName) => handleUpdateFolderName(folder.id, newName)}
                        style={{ flex: 1 }}
                      />
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
                        <div className="name-wrapper" style={{ flex: 1, overflow: 'hidden' }}>
                          <EditableText 
                            text={req.name} 
                            onSave={(newName) => handleUpdateRequestName(req.id, newName)}
                          />
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
                    <div className="name-wrapper" style={{ flex: 1, overflow: 'hidden' }}>
                      <EditableText 
                        text={req.name} 
                        onSave={(newName) => handleUpdateRequestName(req.id, newName)}
                      />
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
          <div 
            className={`collection-header ${activeEnvId === 'globals' ? 'active' : ''}`}
            onClick={() => { setModalData({ id: 'globals', name: 'Globals', variables: globals }); setModalOpen('environment'); }}
            style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}
          >
            <Server size={16} style={{marginRight: '8px', color: 'var(--accent-color)'}}/>
            <span style={{flex: 1, fontWeight: 600}}>Global Variables</span>
            <div className="item-actions">
              <Plus size={14} />
            </div>
          </div>
        )}

        {activeTab === 'environments' && environments.map(env => (
          <div 
            key={env.id} 
            className={`collection-header ${activeEnvId === env.id ? 'active' : ''}`}
            onClick={() => setActiveEnvId(env.id)}
            onDoubleClick={() => { setModalData({ id: env.id, name: env.name, variables: env.variables }); setModalOpen('environment'); }}
          >
            <Server size={16} style={{marginRight: '8px', color: 'var(--text-secondary)'}}/>
            <span style={{flex: 1}}>{env.name}</span>
            <div className="item-actions">
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setModalData({ id: env.id, name: env.name, variables: env.variables }); setModalOpen('environment'); }} title="Edit"><Edit3 size={14} /></button>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEnvironment(env.id); }} title="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* MAIN PANEL */}
    <div className="main-panel">
      {activeTab === 'activity' ? (
        <ActivityLogs activeWorkspaceId={activeWorkspaceId} />
      ) : (
        <RequestEditor 
          activeRequest={activeRequest}
          setActiveRequest={setActiveRequest}
          setActiveTab={setActiveTab}
          environments={environments}
          activeEnvId={activeEnvId}
          setActiveEnvId={setActiveEnvId}
          globals={globals}
          handleSaveRequest={handleSaveRequest}
          handleCopyAsCurl={handleCopyAsCurl}
          handleUrlPaste={handleUrlPaste}
          handleSendRequest={handleSendRequest}
          isSending={isSending}
          response={response}
          editorTab={editorTab}
          setEditorTab={setEditorTab}
        />
      )}
    </div>
  </div>
);
};

export default Dashboard;
