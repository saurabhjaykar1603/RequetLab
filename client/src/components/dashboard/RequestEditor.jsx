import { Play, Copy, Save, ChevronDown } from 'lucide-react';
import KvTable from './KvTable';

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

export default RequestEditor;
