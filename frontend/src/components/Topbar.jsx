import { useState } from 'react';
import axios from 'axios';
import MembersModal from './MembersModal';

const api = axios.create({ withCredentials: true });

const ROLE_STYLE = {
  owner:   { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' },
  teacher: { color: '#4f8ef7', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)' },
  student: { color: '#8b9cbf', background: 'rgba(139,156,191,0.1)',  border: '1px solid rgba(139,156,191,0.2)' },
};

export default function Topbar({ user, totalDone, totalLessons }) {
  const [showMembers, setShowMembers] = useState(false);

  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    window.location.reload();
  };

  const pct = totalLessons ? Math.round(totalDone / totalLessons * 100) : 0;

  return (
    <>
      <div style={{
        height: 48, background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0,
      }}>
        {/* Progress summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 120, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'var(--green)', borderRadius: 2,
              transition: 'width 0.4s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalDone}/{totalLessons} bài ({pct}%)
          </span>
        </div>

        {/* User section */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.role === 'owner' && (
              <button
                onClick={() => setShowMembers(true)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', borderRadius: 5,
                  padding: '3px 10px', cursor: 'pointer', fontSize: 12,
                }}
              >
                Thành viên
              </button>
            )}
            {user.avatar && (
              <img src={user.avatar} alt={user.name} style={{ width: 26, height: 26, borderRadius: '50%' }} />
            )}
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{user.name}</span>
            {user.role && (
              <span style={{
                fontSize: 10, fontWeight: 600, borderRadius: 4,
                padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.05em',
                ...ROLE_STYLE[user.role],
              }}>
                {user.role}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-muted)', borderRadius: 5,
                padding: '3px 10px', cursor: 'pointer', fontSize: 12,
              }}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              background: 'var(--accent)', border: 'none', color: '#fff',
              borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            Đăng nhập bằng Google
          </button>
        )}
      </div>

      {showMembers && <MembersModal onClose={() => setShowMembers(false)} />}
    </>
  );
}
