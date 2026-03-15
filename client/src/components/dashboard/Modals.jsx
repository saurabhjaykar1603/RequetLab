import { AlertTriangle, Bell, Box, Check, Trash2, UserPlus, Users, X } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';

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
  currentUser,
  pendingInvitations,
  handleRespondToInvitation,
  fetchInvitations,
  handleCreateEnvironment,
  handleUpdateEnvironment,
  globals,
  handleUpdateGlobals
}) => {
  if (!modalOpen) return null;

  const handleEnvVarChange = (idx, field, value) => {
    const vars = { ...(modalData.variables || {}) };
    const keys = Object.keys(vars);
    const entries = Object.entries(vars);
    
    if (field === 'key') {
      const oldKey = entries[idx][0];
      const val = entries[idx][1];
      delete vars[oldKey];
      vars[value] = val;
    } else {
      const key = entries[idx][0];
      vars[key] = value;
    }
    setModalData({ ...modalData, variables: vars });
  };

  const addEnvVar = () => {
    const vars = { ...(modalData.variables || {}) };
    let newKey = 'variable';
    let counter = 1;
    while (vars[newKey] !== undefined) {
      newKey = `variable_${counter++}`;
    }
    vars[newKey] = '';
    setModalData({ ...modalData, variables: vars });
  };

  const removeEnvVar = (key) => {
    const vars = { ...(modalData.variables || {}) };
    delete vars[key];
    setModalData({ ...modalData, variables: vars });
  };

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
                  <CustomSelect 
                    options={collections.map(c => ({ value: c.id, label: c.name }))}
                    value={modalData.collectionId}
                    onChange={val => setModalData({...modalData, collectionId: val})}
                    placeholder="Select Collection"
                  />
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
                  <CustomSelect 
                    options={collections.map(c => ({ value: c.id, label: c.name }))}
                    value={modalData.collectionId}
                    onChange={val => setModalData({...modalData, collectionId: val})}
                    placeholder="Select Collection"
                  />
                </div>
                <div className="form-group">
                  <label>Folder (Optional)</label>
                  <CustomSelect 
                    options={[
                      { value: '', label: 'Root' },
                      ...folders.filter(f => f.collectionId === modalData.collectionId).map(f => ({ value: f.id, label: f.name }))
                    ]}
                    value={modalData.folderId || ''}
                    onChange={val => setModalData({...modalData, folderId: val})}
                  />
                </div>
                <div className="form-group">
                  <label>Method</label>
                  <CustomSelect 
                    options={[
                      { value: 'GET', label: 'GET' },
                      { value: 'POST', label: 'POST' },
                      { value: 'PUT', label: 'PUT' },
                      { value: 'DELETE', label: 'DELETE' }
                    ]}
                    value={modalData.method || 'GET'}
                    onChange={val => setModalData({...modalData, method: val})}
                  />
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
                  <CustomSelect 
                    options={[
                      { value: 'personal', label: 'Personal' },
                      { value: 'team', label: 'Team' }
                    ]}
                    value={modalData.workspaceType || 'personal'}
                    onChange={val => setModalData({...modalData, workspaceType: val})}
                  />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Switch Workspace</h3>
                {pendingInvitations.length > 0 && (
                  <button 
                    className="icon-btn" 
                    onClick={() => setModalOpen('invitations')}
                    style={{ background: 'rgba(239, 104, 25, 0.1)', color: 'var(--accent-color)', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Bell size={12} />
                    {pendingInvitations.length} Pending
                  </button>
                )}
              </div>
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
                    {w.role === 'admin' && (
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
                    )}
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
                  <CustomSelect 
                    options={[
                      { value: 'member', label: 'Member' },
                      { value: 'admin', label: 'Admin' }
                    ]}
                    value={modalData.role || 'member'}
                    onChange={val => setModalData({...modalData, role: val})}
                  />
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

      {modalOpen === 'invitations' && (
        <div className="modal-overlay" onClick={() => setModalOpen('workspace-switch')}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pending Invitations ({pendingInvitations.length})</h3>
              <button className="icon-btn" onClick={() => setModalOpen('workspace-switch')}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ padding: '0' }}>
              <div className="invitations-list">
                {pendingInvitations.map(invite => (
                  <div key={invite.id} className="invitation-item" style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
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
                        {invite.inviterName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '14px', lineHeight: 1.4 }}>
                        <strong>{invite.inviterName}</strong> invited you to join <strong>{invite.workspaceName}</strong> as a <strong>{invite.role}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleRespondToInvitation(invite.id, 'rejected')}
                      >
                        Decline
                      </button>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '6px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleRespondToInvitation(invite.id, 'accepted')}
                      >
                        <Check size={14} /> Accept
                      </button>
                    </div>
                  </div>
                ))}
                {pendingInvitations.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No pending invitations
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {modalOpen === 'delete-confirm' && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0 }}>Delete {modalData.type}?</h3>
              </div>
              <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ padding: '20px', lineHeight: '1.5' }}>
              <p>Are you sure you want to delete <strong>{modalData.name}</strong>?</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {modalData.message || 'This action cannot be undone.'}
              </p>
            </div>
            <div className="modal-footer" style={{ background: 'rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
              <button 
                className="btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  modalData.onConfirm();
                  setModalOpen(null);
                }}
              >
                Delete
              </button>
            </div>
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
      {modalOpen === 'environment' && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalData.id ? (modalData.id === 'globals' ? 'Edit Global Variables' : 'Edit Environment') : 'New Environment'}</h3>
              <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18}/></button>
            </div>
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              if (modalData.id === 'globals') {
                handleUpdateGlobals(modalData.variables);
                setModalOpen(null);
              } else {
                modalData.id ? handleUpdateEnvironment(e) : handleCreateEnvironment(e);
              }
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input autoFocus required value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="e.g. Production" />
                </div>
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label>Variables</label>
                    <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={addEnvVar}>+ Add Variable</button>
                  </div>
                  <div className="env-vars-editor" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {Object.entries(modalData.variables || {}).map(([key, val], idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input 
                          style={{ flex: 1 }} 
                          value={key} 
                          onChange={(e) => handleEnvVarChange(idx, 'key', e.target.value)} 
                          placeholder="Variable Name" 
                        />
                        <input 
                          style={{ flex: 1 }} 
                          value={val} 
                          onChange={(e) => handleEnvVarChange(idx, 'value', e.target.value)} 
                          placeholder="Value" 
                        />
                        <button type="button" className="icon-btn" onClick={() => removeEnvVar(key)} style={{ color: '#ef4444' }}><Trash2 size={16}/></button>
                      </div>
                    ))}
                    {Object.keys(modalData.variables || {}).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
                        No variables defined yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="btn-primary">{modalData.id ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;
