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

export default function Sidebar({ curriculum, allLessons, currentId, done, saved, onSelect }) {
  const [openSubjects, setOpenSubjects] = useState({});
  const [openSessions, setOpenSessions] = useState({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('curriculum'); // 'curriculum' | 'saved'

  const toggleSubject = (id) => setOpenSubjects(p => ({ ...p, [id]: !p[id] }));

  // Tính set các bài được phép truy cập:
  // bài đã done + bài đầu tiên chưa done (bài tiếp theo ngay sau chuỗi done liên tiếp)
  const unlockedIds = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < allLessons.length; i++) {
      const l = allLessons[i];
      if (done.includes(l.id)) {
        set.add(l.id);
      } else {
        set.add(l.id); // bài đầu tiên chưa done được mở
        break;         // dừng tại đây, các bài sau bị khóa
      }
    }
    return set;
  }, [allLessons, done]);
  const toggleSession = (id) => setOpenSessions(p => ({ ...p, [id]: !p[id] }));

  // Flatten all lessons for search & saved
  const flatLessons = useMemo(() => {
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
    () => flatLessons.filter(l => saved.includes(l.id)),
    [flatLessons, saved]
  );

  // Group bài đã lưu theo môn học
  const savedBySubject = useMemo(() => {
    return curriculum
      .filter(sub => sub.id && sub.title)
      .map(sub => {
        const lessons = [];
        sub.sessions.forEach(ses =>
          ses.lessons.forEach(l => {
            if (saved.includes(l.id)) lessons.push(l);
          })
        );
        return { ...sub, savedLessons: lessons };
      })
      .filter(sub => sub.savedLessons.length > 0);
  }, [curriculum, saved]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return flatLessons.filter(l => l.title.toLowerCase().includes(q));
  }, [search, flatLessons]);

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
              <LessonRow key={les.id} lesson={les} currentId={currentId} done={done} onSelect={onSelect} unlocked={unlockedIds.has(les.id)} />
            ))}
          </div>
        )}

        {/* Saved tab */}
        {!search.trim() && tab === 'saved' && (
          savedBySubject.length === 0
            ? <div style={{ padding: '20px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Chưa có bài nào được lưu.</div>
            : savedBySubject.map(sub => {
              const color = COLOR_MAP[sub.color] || 'var(--accent)';
              return (
                <div key={sub.id}>
                  {/* Subject header */}
                  <div style={{
                    padding: '8px 14px 4px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color,
                      borderLeft: `3px solid ${color}`, paddingLeft: 7,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {sub.title}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {sub.savedLessons.length}
                    </span>
                  </div>
                  {sub.savedLessons.map(les => (
                    <LessonRow key={les.id} lesson={les} currentId={currentId} done={done} onSelect={onSelect} indent unlocked={unlockedIds.has(les.id)} />
                  ))}
                </div>
              );
            })
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
                        <LessonRow key={les.id} lesson={les} currentId={currentId} done={done} onSelect={onSelect} indent unlocked={unlockedIds.has(les.id)} />
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

function LessonRow({ lesson, currentId, done, onSelect, indent, unlocked }) {
  const isActive = lesson.id === currentId;
  const isDone = done.includes(lesson.id);
  const locked = !unlocked;

  return (
    <button
      onClick={() => !locked && onSelect(lesson.id)}
      disabled={locked}
      title={locked ? 'Hoàn thành bài trước để mở khoá' : ''}
      style={{
        width: '100%',
        background: isActive ? 'rgba(79,142,247,0.12)' : 'none',
        border: 'none',
        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: `6px 14px 6px ${indent ? 44 : 14}px`,
        cursor: locked ? 'default' : 'pointer',
        color: locked ? 'var(--text-muted)' : isActive ? 'var(--accent)' : 'var(--text)',
        textAlign: 'left',
        opacity: locked ? 0.45 : 1,
      }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: '50%',
        background: isDone ? 'var(--green)' : locked ? 'var(--border)' : 'var(--border)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: locked ? 9 : 8, color: locked ? 'var(--text-muted)' : '#fff',
      }}>
        {isDone ? '✓' : locked ? '🔒' : ''}
      </span>
      <span style={{ fontSize: 12, lineHeight: 1.3, flex: 1 }}>{lesson.title}</span>
    </button>
  );
}
