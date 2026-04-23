import { useState, useMemo } from 'react';

const COLOR_MAP = {
  'si-blue': '#4f8ef7',
  'si-green': '#22c55e',
  'si-amber': '#f59e0b',
  'si-purple': '#a855f7',
};

function ProgressRing({ pct, size = 18 }) {
  const r = (size - 3) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={2.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--green)" strokeWidth={2.5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s' }}
      />
    </svg>
  );
}

export default function Sidebar({ curriculum, currentId, done, saved, onSelect }) {
  const [openSubjects, setOpenSubjects] = useState({});
  const [openSessions, setOpenSessions] = useState({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('curriculum'); // 'curriculum' | 'saved'

  const toggleSubject = (id) => setOpenSubjects(p => ({ ...p, [id]: !p[id] }));
  const toggleSession = (id) => setOpenSessions(p => ({ ...p, [id]: !p[id] }));

  // Flatten all lessons for search & saved
  const allLessons = useMemo(() => {
    const list = [];
    curriculum.forEach(sub => {
      sub.sessions.forEach(ses => {
        ses.lessons.forEach(les => {
          list.push({ ...les, subjectTitle: sub.title, sessionTitle: ses.title });
        });
      });
    });
    return list;
  }, [curriculum]);

  const savedLessons = useMemo(
    () => allLessons.filter(l => saved.includes(l.id)),
    [allLessons, saved]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allLessons.filter(l => l.title.toLowerCase().includes(q));
  }, [search, allLessons]);

  const getSubjectProgress = (sub) => {
    const ids = sub.sessions.flatMap(s => s.lessons.map(l => l.id));
    if (!ids.length) return 0;
    return Math.round(ids.filter(id => done.includes(id)).length / ids.length * 100);
  };

  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 10 }}>
          📘 LearnFlow
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm bài học..."
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '7px 10px', color: 'var(--text)',
            fontSize: 13, outline: 'none',
          }}
        />
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {['curriculum', 'saved'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: tab === t ? 'var(--accent)' : 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: 6,
              color: tab === t ? '#fff' : 'var(--text-muted)',
              padding: '5px 0', fontSize: 12, cursor: 'pointer',
            }}>
              {t === 'curriculum' ? 'Môn học' : `★ Đã lưu${savedLessons.length ? ` (${savedLessons.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>

        {/* Search results */}
        {search.trim() && (
          <div>
            <div style={{ padding: '4px 14px 6px', fontSize: 11, color: 'var(--text-muted)' }}>
              {searchResults.length} kết quả
            </div>
            {searchResults.map(les => (
              <LessonRow key={les.id} lesson={les} currentId={currentId} done={done} onSelect={onSelect} />
            ))}
          </div>
        )}

        {/* Saved tab */}
        {!search.trim() && tab === 'saved' && (
          savedLessons.length === 0
            ? <div style={{ padding: '20px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Chưa có bài nào được lưu.</div>
            : savedLessons.map(les => (
              <LessonRow key={les.id} lesson={les} currentId={currentId} done={done} onSelect={onSelect} />
            ))
        )}

        {/* Curriculum tab */}
        {!search.trim() && tab === 'curriculum' && curriculum
          .filter(sub => sub.id && sub.title)
          .map(sub => {
            const color = COLOR_MAP[sub.color] || 'var(--accent)';
            const pct = getSubjectProgress(sub);
            const isOpen = openSubjects[sub.id];
            return (
              <div key={sub.id}>
                {/* Subject row */}
                <button onClick={() => toggleSubject(sub.id)} style={{
                  width: '100%', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', cursor: 'pointer',
                  color: 'var(--text)', textAlign: 'left',
                }}>
                  <ProgressRing pct={pct} />
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: 500,
                    borderLeft: `3px solid ${color}`, paddingLeft: 8,
                  }}>
                    {sub.title}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && sub.sessions.map(ses => {
                  const sesOpen = openSessions[ses.id];
                  const sesDone = ses.lessons.filter(l => done.includes(l.id)).length;
                  return (
                    <div key={ses.id}>
                      {/* Session row */}
                      <button onClick={() => toggleSession(ses.id)} style={{
                        width: '100%', background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center',
                        padding: '6px 14px 6px 28px', cursor: 'pointer',
                        color: 'var(--text-muted)', textAlign: 'left', gap: 6,
                      }}>
                        <span style={{ fontSize: 9 }}>{sesOpen ? '▼' : '▶'}</span>
                        <span style={{ flex: 1, fontSize: 12, lineHeight: 1.3 }}>
                          {ses.title}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {sesDone}/{ses.lessons.length}
                        </span>
                      </button>
                      {sesOpen && ses.lessons.map(les => (
                        <LessonRow key={les.id} lesson={les} currentId={currentId} done={done} onSelect={onSelect} indent />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function LessonRow({ lesson, currentId, done, onSelect, indent }) {
  const isActive = lesson.id === currentId;
  const isDone = done.includes(lesson.id);
  return (
    <button
      onClick={() => onSelect(lesson.id)}
      style={{
        width: '100%', background: isActive ? 'rgba(79,142,247,0.12)' : 'none',
        border: 'none', borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: `6px 14px 6px ${indent ? 44 : 14}px`,
        cursor: 'pointer', color: isActive ? 'var(--accent)' : 'var(--text)',
        textAlign: 'left',
      }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: '50%',
        background: isDone ? 'var(--green)' : 'var(--border)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, color: '#fff',
      }}>
        {isDone ? '✓' : ''}
      </span>
      <span style={{ fontSize: 12, lineHeight: 1.3, flex: 1 }}>{lesson.title}</span>
    </button>
  );
}
