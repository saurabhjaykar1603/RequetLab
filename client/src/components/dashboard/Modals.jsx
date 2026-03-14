import React from 'react';
import { X, Box, Trash2, AlertTriangle, UserPlus, Users } from 'lucide-react';

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
  handleDeleteWorkspace,
  handleInviteMember,
  workspaceMembers,
  fetchMembers,
  handleRemoveMember,
  collections,
  folders,
  workspaces,
  activeWorkspaceId,
  currentUser
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
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1}}>
                    <div className="workspace-icon">
                      <Box size={14} />
                    </div>
                    <div>
                      <div style={{fontWeight: 500}}>{w.name}</div>
                      <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>{w.type}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {w.type === 'team' && (
                      <>
                        <button 
                          className="icon-btn" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setModalData({ ...modalData, workspaceId: w.id, workspaceName: w.name, email: '', role: 'member' });
                            setModalOpen('invite-member');
                          }}
                          title="Invite Member"
                          style={{ padding: '6px' }}
                        >
                          <UserPlus size={14} />
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setModalData({ ...modalData, workspaceId: w.id, workspaceName: w.name });
                            fetchMembers(w.id);
                            setModalOpen('workspace-members');
                          }}
                          title="Manage Members"
                          style={{ padding: '6px' }}
                        >
                          <Users size={14} />
                        </button>
                      </>
                    )}
                    <button 
                      className="icon-btn delete-hover" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setModalData({ ...modalData, workspaceToDelete: w });
                        setModalOpen('workspace-delete-confirm');
                      }}
                      title="Delete Workspace"
                      style={{ padding: '6px', color: 'var(--text-secondary)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalOpen === 'workspace-members' && (
        <div className="modal-overlay" onClick={() => setModalOpen('workspace-switch')}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Members of {modalData.workspaceName}</h3>
              <button className="icon-btn" onClick={() => setModalOpen('workspace-switch')}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ padding: '0' }}>
              <div className="members-list">
                {workspaceMembers.map(member => {
                  const isAdmin = workspaceMembers.find(m => m.id === currentUser?.id)?.role === 'admin';
                  const isSelf = member.id === currentUser?.id;

                  return (
                    <div key={member.id} className="member-item" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--accent-color)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>
                            {member.name} {isSelf && <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 'normal' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          background: member.role === 'admin' ? 'rgba(239, 104, 25, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: member.role === 'admin' ? 'var(--accent-color)' : 'var(--text-secondary)',
                          border: member.role === 'admin' ? '1px solid var(--accent-color)' : '1px solid transparent'
                        }}>
                          {member.role}
                        </span>
                        {isAdmin && !isSelf && (
                          <button 
                            className="icon-btn delete-hover" 
                            onClick={() => handleRemoveMember(modalData.workspaceId, member.id)}
                            title="Remove Member"
                            style={{ padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setModalOpen('invite-member')}>
                Invite New Member
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen === 'invite-member' && (
        <div className="modal-overlay" onClick={() => setModalOpen('workspace-switch')}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite to {modalData.workspaceName}</h3>
              <button className="icon-btn" onClick={() => setModalOpen('workspace-switch')}><X size={18}/></button>
            </div>
            <form onSubmit={handleInviteMember}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="form-group">
                  <label>Friend's Email</label>
                  <input 
                    autoFocus 
                    type="email" 
                    required 
                    placeholder="name@example.com"
                    value={modalData.email || ''} 
                    onChange={e => setModalData({ ...modalData, email: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Role</label>
                  <select 
                    value={modalData.role || 'member'} 
                    onChange={e => setModalData({ ...modalData, role: e.target.value })}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen('workspace-switch')}>Cancel</button>
                <button type="submit" className="btn-primary">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalOpen === 'workspace-delete-confirm' && (
        <div className="modal-overlay" onClick={() => setModalOpen('workspace-switch')}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0 }}>Delete Workspace?</h3>
              </div>
              <button className="icon-btn" onClick={() => setModalOpen('workspace-switch')}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', lineHeight: '1.5' }}>
              <p>Are you sure you want to delete <strong>{modalData.workspaceToDelete?.name}</strong>?</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                This will permanently delete all collections, folders, and requests within this workspace. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ background: 'rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setModalOpen('workspace-switch')}>Cancel</button>
              <button 
                className="btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => handleDeleteWorkspace(modalData.workspaceToDelete?.id)}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;
