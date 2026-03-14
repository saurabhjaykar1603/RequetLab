import { Trash2 } from 'lucide-react';

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

export default KvTable;
