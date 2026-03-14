import { 
  History, User, Tag, 
  Calendar, ChevronLeft, ChevronRight, 
  Filter, RotateCcw, Search
} from 'lucide-react';
import CustomSelect from '../common/CustomSelect';
import { useState ,useEffect} from 'react';
import { api } from '../../api';

const ActivityLogs = ({ activeWorkspaceId }) => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: ''
  });
  const [members, setMembers] = useState([]);

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'INVITE', label: 'Invite' },
    { value: 'ACCEPT', label: 'Accept' },
    { value: 'REJECT', label: 'Reject' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'SIGNUP', label: 'Signup' },
    { value: 'SIGNOUT', label: 'Signout' },
  ];

  const entityOptions = [
    { value: '', label: 'All Types' },
    { value: 'COLLECTION', label: 'Collection' },
    { value: 'FOLDER', label: 'Folder' },
    { value: 'REQUEST', label: 'Request' },
    { value: 'ENVIRONMENT', label: 'Environment' },
    { value: 'INVITATION', label: 'Invitation' },
    { value: 'USER', label: 'User' },
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getActivityLogs({
        ...filters,
        limit,
        offset: page * limit
      });
      if (res.logs) {
        setLogs(res.logs);
        setTotal(res.total);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await api.getWorkspaceMembers(activeWorkspaceId);
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  };

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchLogs();
      fetchMembers();
    }
  }, [activeWorkspaceId, page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({ action: '', entityType: '', userId: '' });
    setPage(0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return '#10b981'; // Green
      case 'UPDATE': return '#3b82f6'; // Blue
      case 'DELETE': return '#ef4444'; // Red
      case 'INVITE': return '#f59e0b'; // Amber
      case 'ACCEPT': return '#8b5cf6'; // Violet
      case 'REJECT': return '#6b7280'; // Gray
      case 'LOGIN': return '#ec4899'; // Pink
      case 'SIGNUP': return '#8b5cf6'; // Violet
      case 'SIGNOUT': return '#9ca3af'; // Light gray
      default: return 'var(--text-secondary)';
    }
  };

  const getEntityColor = (type) => {
    switch (type) {
      case 'COLLECTION': return '#f97316'; // orange
      case 'FOLDER': return '#eab308'; // yellow
      case 'REQUEST': return '#06b6d4'; // cyan
      case 'ENVIRONMENT': return '#a855f7'; // purple
      case 'INVITATION': return '#14b8a6'; // teal
      case 'USER': return '#3b82f6'; // blue
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="activity-logs-container" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <History size={24} color="var(--accent-color)" />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Activity Logs</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchLogs} title="Refresh">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="filters-bar" style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px', 
        padding: '12px 16px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '180px' }}>
          <Filter size={14} color="var(--text-secondary)" />
          <CustomSelect 
            options={actionOptions}
            value={filters.action}
            onChange={(val) => handleFilterChange('action', val)}
            placeholder="All Actions"
            className="filter-select"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '180px' }}>
          <Tag size={14} color="var(--text-secondary)" />
          <CustomSelect 
            options={entityOptions}
            value={filters.entityType}
            onChange={(val) => handleFilterChange('entityType', val)}
            placeholder="All Types"
            className="filter-select"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '220px' }}>
          <User size={14} color="var(--text-secondary)" />
          <CustomSelect 
            options={[
              { value: '', label: 'All Users' },
              ...members.map(m => ({ value: m.id, label: m.name }))
            ]}
            value={filters.userId}
            onChange={(val) => handleFilterChange('userId', val)}
            placeholder="All Users"
            className="filter-select"
          />
        </div>

        <button className="btn-secondary" onClick={resetFilters} style={{ marginLeft: 'auto', height: '32px' }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="logs-table-wrapper" style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table className="logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1, borderBottom: '2px solid var(--border-color)' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Entity Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Entity Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Details</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No activity logs found.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--accent-color)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: 'white',
                      fontWeight: 600
                    }}>
                      {log.userName?.charAt(0).toUpperCase()}
                    </div>
                    <span>{log.userName}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    backgroundColor: `${getActionColor(log.action)}20`, 
                    color: getActionColor(log.action),
                    border: `1px solid ${getActionColor(log.action)}40`
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: getEntityColor(log.entityType),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getEntityColor(log.entityType) }}></div>
                    {log.entityType}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.entityName || '-'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {log.details || '-'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {formatDate(log.createdAt)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Showing {logs.length} of {total} activities
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-secondary" 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '4px 12px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '14px' }}>
            Page {page + 1} of {Math.ceil(total / limit) || 1}
          </div>
          <button 
            className="btn-secondary" 
            disabled={(page + 1) * limit >= total} 
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '4px 12px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
