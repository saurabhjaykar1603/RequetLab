import { X, Box } from 'lucide-react';

const Modals = ({
  modalOpen,
  setModalOpen,
  modalData,
  setModalData,
  handleCreateCollection,
  handleCreateFolder,
  handleCreateRequest,
  handleImportCollection,
  handleCreateWorkspace,
  handleWorkspaceChange,
  collections,
  folders,
  workspaces,
  activeWorkspaceId
}) => {
  if (!modalOpen) return null;

  return (
    <>
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
  );
};

export default Modals;
