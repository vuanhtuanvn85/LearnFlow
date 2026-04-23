import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ withCredentials: true });

const ROLE_LABEL = { owner: 'Owner', teacher: 'Teacher', student: 'Student' };
const ROLE_COLOR = {
  owner:   { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' },
  teacher: { color: '#4f8ef7', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)' },
  student: { color: '#8b9cbf', background: 'rgba(139,156,191,0.1)',  border: '1px solid rgba(139,156,191,0.2)' },
};

export default function MembersModal({ onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // id đang cập nhật

  useEffect(() => {
    api.get('/api/admin/members')
      .then(r => setMembers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (id, role) => {
    setUpdating(id);
    try {
      const { data } = await api.patch(`/api/admin/members/${id}`, { role });
      setMembers(prev => prev.map(m => m._id === id ? { ...m, role: data.role } : m));
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi đổi role');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, width: 560, maxWidth: '92vw', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Quản lý thành viên</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Thành viên', 'Email', 'Role'].map(h => (
                    <th key={h} style={{
                      padding: '10px 20px', textAlign: 'left',
                      fontSize: 12, fontWeight: 600,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Avatar + Name */}
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {m.avatar
                          ? <img src={m.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                          : <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, color: 'var(--text-muted)',
                            }}>{m.name[0]}</div>
                        }
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{m.name}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</td>
                    {/* Role */}
                    <td style={{ padding: '12px 20px' }}>
                      {m.role === 'owner' ? (
                        <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '3px 8px', ...ROLE_COLOR.owner }}>
                          Owner
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          disabled={updating === m._id}
                          onChange={e => changeRole(m._id, e.target.value)}
                          style={{
                            background: 'var(--bg3)', border: '1px solid var(--border)',
                            color: 'var(--text)', borderRadius: 5, padding: '4px 8px',
                            fontSize: 12, cursor: 'pointer',
                            opacity: updating === m._id ? 0.5 : 1,
                          }}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          {members.length} thành viên
        </div>
      </div>
    </div>
  );
}
