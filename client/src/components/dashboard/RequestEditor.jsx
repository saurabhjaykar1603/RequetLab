import { Copy, Play, Save, Settings } from 'lucide-react';
import React from 'react';
import CustomSelect from '../common/CustomSelect';
import KvTable from './KvTable';

const RequestEditor = ({ 
  activeRequest, 
  setActiveRequest,
  environments, 
  activeEnvId, 
  setActiveEnvId, 
  setActiveTab,
  globals,
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

  const backdropRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const bodyBackdropRef = React.useRef(null);
  const bodyInputRef = React.useRef(null);

  const syncScroll = () => {
    if (backdropRef.current && inputRef.current) {
      backdropRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  const syncBodyScroll = () => {
    if (bodyBackdropRef.current && bodyInputRef.current) {
      bodyBackdropRef.current.scrollTop = bodyInputRef.current.scrollTop;
      bodyBackdropRef.current.scrollLeft = bodyInputRef.current.scrollLeft;
    }
  };

  const renderHighlightedText = (text) => {
    if (!text) return null;
    const activeEnv = environments.find(e => e.id === activeEnvId);
    const combinedVars = { ...globals, ...(activeEnv?.variables || {}) };
    const parts = text.split(/({{.*?}})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2).trim();
        const value = combinedVars[key];
        const status = (value !== undefined && value !== null && value !== '') ? 'resolved' : 'unresolved';
        return <span key={i} className={`var-span ${status}`}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderHighlightedJson = (json) => {
    if (!json) return null;
    
    // Regex for: vars, keys, strings, booleans/nulls, numbers
    const regex = /({{.*?}})|(".*?"\s*(?=:))|(".*?")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    
    let result = [];
    let lastIndex = 0;
    let match;
    
    // Use exec for precise group matching
    while ((match = regex.exec(json)) !== null) {
      // Add unhighlighted text before the match
      if (match.index > lastIndex) {
        result.push(<span key={`text-${lastIndex}`}>{json.slice(lastIndex, match.index)}</span>);
      }
      
      const [fullMatch, envVar, key, string, boolNull, number] = match;
      
      if (envVar) {
        result.push(renderHighlightedText(envVar));
      } else if (key) {
        result.push(<span key={`key-${match.index}`} className="json-hl-key">{key}</span>);
      } else if (string) {
        // String value - might contain env vars
        result.push(<span key={`str-${match.index}`} className="json-hl-string">{renderHighlightedText(string)}</span>);
      } else if (boolNull) {
        const className = boolNull === 'null' ? 'json-hl-null' : 'json-hl-boolean';
        result.push(<span key={`bn-${match.index}`} className={className}>{boolNull}</span>);
      } else if (number) {
        result.push(<span key={`num-${match.index}`} className="json-hl-number">{number}</span>);
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < json.length) {
      result.push(<span key={`text-${lastIndex}`}>{json.slice(lastIndex)}</span>);
    }
    
    return result;
  };

  const beautifyJson = () => {
    try {
      const content = activeRequest.body?.content || '';
      if (!content) return;
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      handleChange('body', { ...activeRequest.body, content: formatted });
    } catch (err) {
      // If invalid JSON, don't do anything or show a hint
    }
  };

  return (
    <div className="request-editor">
      <div className="editor-header">
        <div className="request-title-bar">
          <h3>{activeRequest.name}</h3>
          <div style={{display: 'flex', gap: '8px'}}>
            <CustomSelect 
              options={[
                { value: '', label: 'No environment' },
                ...environments.map(env => ({ value: env.id, label: env.name }))
              ]}
              value={activeEnvId}
              onChange={setActiveEnvId}
              className="env-select-custom"
              renderValue={(opt) => (
                <span style={{ color: opt?.value ? 'var(--accent-color)' : 'inherit', fontWeight: opt?.value ? '600' : 'normal' }}>
                  {opt?.label || 'No environment'}
                </span>
              )}
              footerAction={{
                label: "Manage Environments",
                icon: Settings,
                onClick: () => setActiveTab('environments')
              }}
            />
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
            <CustomSelect 
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'PATCH', label: 'PATCH' }
              ]}
              value={activeRequest.method}
              onChange={(val) => handleChange('method', val)}
              className="method-select-custom"
              renderOption={(opt) => (
                <span className={`method-${opt.value}`}>{opt.label}</span>
              )}
              renderValue={(opt) => (
                <span className={`method-${opt?.value}`} style={{fontWeight: 'bold'}}>{opt?.label || 'GET'}</span>
              )}
            />
            <div className="highlighted-input-container">
              <div className="highlighted-input-backdrop" ref={backdropRef}>
                {renderHighlightedText(activeRequest.url)}
              </div>
              <input 
                ref={inputRef}
                className="url-input highlight-mode" 
                value={activeRequest.url}
                onChange={(e) => handleChange('url', e.target.value)} 
                onScroll={syncScroll}
                onPaste={handleUrlPaste}
                placeholder="Enter URL or paste cURL"
                spellCheck="false"
              />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSendRequest} disabled={isSending}>
             {isSending ? 'Sending...' : 'Send'}
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
              <CustomSelect 
                options={[
                  { value: 'none', label: 'none' },
                  { value: 'json', label: 'JSON' },
                  { value: 'form-data', label: 'form-data' }
                ]}
                value={activeRequest.body?.type || 'none'}
                onChange={(val) => handleChange('body', { ...activeRequest.body, type: val })}
                className="body-type-select-custom"
              />
            </div>
            {activeRequest.body?.type === 'json' && (
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <div style={{display:'flex', justifyContent:'flex-end'}}>
                  <button className="beautify-btn" onClick={beautifyJson}>Beautify</button>
                </div>
                <div className="code-editor-container">
                  <div className="code-editor-backdrop" ref={bodyBackdropRef}>
                    {renderHighlightedJson(activeRequest.body?.content)}
                  </div>
                  <textarea 
                    ref={bodyInputRef}
                    className="code-editor"
                    value={activeRequest.body?.content || ''}
                    onChange={(e) => handleChange('body', { ...activeRequest.body, content: e.target.value })}
                    onScroll={syncBodyScroll}
                    placeholder="{}"
                    spellCheck="false"
                  />
                </div>
              </div>
            )}
            {activeRequest.body?.type === 'form-data' && (
              <KvTable 
                field="body" 
                activeRequest={{ ...activeRequest, body: activeRequest.body.content }} 
                setActiveRequest={(updater) => {
                  const updatedReq = typeof updater === 'function' ? updater({ ...activeRequest, body: activeRequest.body.content }) : updater;
                  handleChange('body', { ...activeRequest.body, content: updatedReq.body });
                }} 
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
              {typeof response.data === 'object' 
                ? renderHighlightedJson(JSON.stringify(response.data, null, 2)) 
                : response.data}
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
