import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../api';

const ROLE_COLOR = {
  owner:   { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' },
  teacher: { color: '#4f8ef7', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)' },
  student: { color: '#8b9cbf', background: 'rgba(139,156,191,0.1)',  border: '1px solid rgba(139,156,191,0.2)' },
};

function Avatar({ user }) {
  if (user.avatar) return <img src={user.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />;
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      background: 'var(--bg3)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)',
    }}>{(user.name || '?')[0]}</div>
  );
}

// ── Tab 1: Danh sách thành viên + đổi role ────────────────
function MembersTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

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

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>;

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Thành viên', 'Email', 'Role'].map(h => (
              <th key={h} style={{
                padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '11px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar user={m} />
                  <span style={{ fontSize: 13 }}>{m.name}</span>
                </div>
              </td>
              <td style={{ padding: '11px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</td>
              <td style={{ padding: '11px 20px' }}>
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
      <div style={{ padding: '10px 20px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        {members.length} thành viên
      </div>
    </div>
  );
}

// ── Tab 2: Đăng ký khoá học ───────────────────────────────
function EnrollmentTab({ curriculum }) {
  const subjects = curriculum.filter(s => s.id && s.title);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const loadEnrollments = useCallback(async (subjectId) => {
    if (!subjectId) return;
    setLoading(true); setImportResult(null);
    try {
      const { data } = await api.get(`/api/enrollment/${subjectId}`);
      setEnrollments(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEnrollments(selectedSubject); }, [selectedSubject, loadEnrollments]);

  const handleImport = async () => {
    const emails = importText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!emails.length) return;
    setImporting(true); setImportResult(null);
    try {
      const { data } = await api.post(`/api/enrollment/${selectedSubject}/import`, { emails });
      setImportResult(data); setImportText('');
      await loadEnrollments(selectedSubject);
    } catch (err) {
      setImportResult({ error: err.response?.data?.error || 'Lỗi khi import' });
    } finally { setImporting(false); }
  };

  const handleRemove = async (enrollmentId) => {
    setRemoving(enrollmentId);
    try {
      await api.delete(`/api/enrollment/${selectedSubject}/${enrollmentId}`);
      setEnrollments(prev => prev.filter(e => e.enrollmentId !== enrollmentId));
    } catch (err) { alert(err.response?.data?.error || 'Lỗi khi xoá'); }
    finally { setRemoving(null); }
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left — Import */}
      <div style={{
        width: 210, borderRight: '1px solid var(--border)',
        padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
      }}>
        {/* Subject selector */}
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 6, padding: '6px 8px',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Import email
        </div>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder={'email1@example.com\nemail2@example.com\n...'}
          rows={7}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 6, padding: 8,
            fontSize: 12, fontFamily: 'IBM Plex Mono, monospace',
            resize: 'vertical', lineHeight: 1.6,
          }}
        />
        <button
          onClick={handleImport}
          disabled={importing || !importText.trim()}
          style={{
            background: 'var(--accent)', border: 'none', color: '#fff',
            borderRadius: 6, padding: '7px 12px', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
            opacity: importing || !importText.trim() ? 0.5 : 1,
          }}
        >
          {importing ? 'Đang import...' : 'Import'}
        </button>

        {importResult && (
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            {importResult.error ? (
              <div style={{ color: 'var(--red)' }}>{importResult.error}</div>
            ) : (
              <>
                {importResult.enrolled?.length > 0 && <div style={{ color: 'var(--green)' }}>✓ {importResult.enrolled.length} đã thêm</div>}
                {importResult.alreadyEnrolled?.length > 0 && <div style={{ color: 'var(--amber)' }}>~ {importResult.alreadyEnrolled.length} đã có</div>}
                {importResult.notFound?.length > 0 && (
                  <div style={{ color: 'var(--red)' }}>
                    ✗ {importResult.notFound.length} không tìm thấy:
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, marginTop: 2 }}>
                      {importResult.notFound.map(e => <div key={e}>{e}</div>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right — List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{enrollments.length} học viên</span>
          <button
            onClick={() => window.open(`/api/enrollment/${selectedSubject}/export`, '_blank')}
            disabled={enrollments.length === 0}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', borderRadius: 5,
              padding: '3px 10px', cursor: 'pointer', fontSize: 12,
              opacity: enrollments.length === 0 ? 0.4 : 1,
            }}
          >
            Export CSV
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
          ) : enrollments.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Chưa có học viên nào trong môn này
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Học viên', 'Email', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.map(e => (
                  <tr key={e.enrollmentId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar user={e.user} />
                        <span style={{ fontSize: 13 }}>{e.user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{e.user.email}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleRemove(e.enrollmentId)}
                        disabled={removing === e.enrollmentId}
                        style={{
                          background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                          color: 'var(--red)', borderRadius: 5,
                          padding: '2px 8px', cursor: 'pointer', fontSize: 11,
                          opacity: removing === e.enrollmentId ? 0.5 : 1,
                        }}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Bảng điểm ─────────────────────────────────────
function GradesTab({ curriculum }) {
  const subjects = curriculum.filter(s => s.id && s.title);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [data, setData] = useState(null); // { students, lessons, scores }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({}); // { `${userId}_${lessonId}`: true }
  const [editCells, setEditCells] = useState({}); // { `${userId}_${lessonId}`: string }
  const inputRefs = useRef({});

  // Flatten all lessons cho subject đang chọn — giữ thứ tự bài học
  const allLessonsInSubject = useMemo(() => {
    const sub = curriculum.find(s => s.id === selectedSubject);
    if (!sub) return [];
    const list = [];
    sub.sessions.forEach(ses => ses.lessons.forEach(l => list.push(l)));
    return list;
  }, [curriculum, selectedSubject]);

  const gradedLessons = useMemo(
    () => allLessonsInSubject.filter(l => l.completion && l.completion !== ''),
    [allLessonsInSubject]
  );

  const load = useCallback(async (subjectId, lessons) => {
    if (!subjectId || lessons.length === 0) { setData({ students: [], lessons: [], scores: {} }); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ lessons: JSON.stringify(lessons.map(l => ({ id: l.id, title: l.title, completion: l.completion }))) });
      const res = await api.get(`/api/grades/${subjectId}?${params}`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setEditCells({});
    load(selectedSubject, gradedLessons);
  }, [selectedSubject, gradedLessons, load]);

  const cellKey = (userId, lessonId) => `${userId}_${lessonId}`;

  const getScore = (userId, lessonId) => {
    const s = data?.scores?.[userId]?.[lessonId];
    return s != null ? s.score : null;
  };

  const isSubmitLesson = (lesson) => lesson.completion === 'submit';
  const isQuizLesson = (lesson) => lesson.completion?.startsWith('quiz:');

  const handleCellChange = (userId, lessonId, val) => {
    setEditCells(prev => ({ ...prev, [cellKey(userId, lessonId)]: val }));
  };

  const handleCellBlur = async (userId, lessonId, subjectId) => {
    const key = cellKey(userId, lessonId);
    const raw = editCells[key];
    if (raw === undefined || raw === '') {
      // clear edit state — revert
      setEditCells(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    const score = parseFloat(raw);
    if (isNaN(score) || score < 0 || score > 10) {
      setEditCells(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await api.patch(`/api/grades/${subjectId}/${userId}/${lessonId}`, { score });
      setData(prev => {
        const scores = { ...prev.scores };
        scores[userId] = { ...scores[userId], [lessonId]: { score, type: 'manual' } };
        return { ...prev, scores };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(prev => { const n = { ...prev }; delete n[key]; return n; });
      setEditCells(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleExport = () => {
    if (!data?.students?.length) return;
    const params = new URLSearchParams({ lessons: JSON.stringify(gradedLessons.map(l => ({ id: l.id, title: l.title, completion: l.completion }))) });
    window.open(`/api/grades/${selectedSubject}/export?${params}`, '_blank');
  };

  const completionLabel = (lesson) => {
    if (isSubmitLesson(lesson)) return 'Nộp';
    if (isQuizLesson(lesson)) {
      const n = lesson.completion.split(':')[1];
      return `Quiz/${n}`;
    }
    return '';
  };

  const CELL_W = 72;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer',
          }}
        >
          {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>
          {data ? `${data.students.length} học viên · ${data.lessons.length} bài có điểm` : ''}
        </span>
        <button
          onClick={handleExport}
          disabled={!data?.students?.length}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-muted)', borderRadius: 5,
            padding: '3px 10px', cursor: 'pointer', fontSize: 12,
            opacity: !data?.students?.length ? 0.4 : 1,
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
        ) : !data || data.lessons.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Môn này chưa có bài quiz hoặc bài nộp link.
          </div>
        ) : data.students.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Chưa có học viên nào trong môn này.
          </div>
        ) : (
          <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--bg2)' }}>
                {/* Sticky name column header */}
                <th style={{
                  position: 'sticky', left: 0, zIndex: 2,
                  background: 'var(--bg2)', padding: '9px 16px',
                  textAlign: 'left', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                  whiteSpace: 'nowrap', minWidth: 160,
                }}>
                  Học viên
                </th>
                {data.lessons.map(l => (
                  <th key={l.id} style={{
                    padding: '6px 8px', width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W,
                    textAlign: 'center', fontSize: 11, fontWeight: 500,
                    color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                    verticalAlign: 'bottom',
                  }}>
                    <div style={{
                      writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                      maxHeight: 100, overflow: 'hidden', textOverflow: 'ellipsis',
                      fontSize: 11, lineHeight: 1.3, marginBottom: 4,
                      color: 'var(--text)',
                    }} title={l.title}>
                      {l.title}
                    </div>
                    <div style={{
                      fontSize: 10, color: isSubmitLesson(l) ? 'var(--amber)' : 'var(--accent)',
                      marginTop: 2,
                    }}>
                      {completionLabel(l)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students.map((student, si) => (
                <tr key={student.userId} style={{ borderBottom: '1px solid var(--border)', background: si % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  {/* Sticky name */}
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 1,
                    background: si % 2 === 0 ? 'var(--bg)' : 'var(--bg2)',
                    padding: '8px 16px', borderRight: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {student.avatar
                        ? <img src={student.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                        : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-muted)' }}>{(student.name || '?')[0]}</div>
                      }
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{student.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{student.email}</div>
                      </div>
                    </div>
                  </td>
                  {data.lessons.map(l => {
                    const key = cellKey(student.userId, l.id);
                    const score = getScore(student.userId, l.id);
                    const isEditing = editCells[key] !== undefined;
                    const isSav = saving[key];
                    const isSubmit = isSubmitLesson(l);

                    return (
                      <td key={l.id} style={{ padding: '6px 4px', textAlign: 'center', width: CELL_W }}>
                        {isSubmit ? (
                          // Editable cell for submit-type lessons
                          <input
                            ref={el => { inputRefs.current[key] = el; }}
                            type="number"
                            min={0} max={10} step={0.5}
                            value={isEditing ? editCells[key] : (score != null ? score : '')}
                            placeholder="–"
                            disabled={isSav}
                            onChange={e => handleCellChange(student.userId, l.id, e.target.value)}
                            onBlur={() => handleCellBlur(student.userId, l.id, selectedSubject)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') inputRefs.current[key]?.blur();
                              if (e.key === 'Escape') {
                                setEditCells(prev => { const n = { ...prev }; delete n[key]; return n; });
                              }
                            }}
                            style={{
                              width: 52, textAlign: 'center', padding: '3px 4px',
                              background: isEditing ? 'var(--bg)' : score != null ? 'rgba(245,158,11,0.08)' : 'var(--bg3)',
                              border: `1px solid ${isEditing ? 'var(--amber)' : score != null ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                              borderRadius: 4, color: score != null && !isEditing ? 'var(--amber)' : 'var(--text)',
                              fontSize: 12, outline: 'none',
                              opacity: isSav ? 0.5 : 1,
                            }}
                          />
                        ) : (
                          // Read-only cell for quiz-type lessons
                          <span style={{
                            display: 'inline-block', minWidth: 32, padding: '3px 6px',
                            borderRadius: 4, fontSize: 12, fontWeight: score != null ? 500 : 400,
                            background: score != null ? 'rgba(79,142,247,0.08)' : 'transparent',
                            color: score != null ? 'var(--accent)' : 'var(--text-muted)',
                          }}>
                            {score != null ? score : '–'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Modal chính ───────────────────────────────────────────
export default function MembersModal({ curriculum, onClose, userRole }) {
  // teacher mặc định vào tab grades; owner vào members
  const [tab, setTab] = useState(userRole === 'owner' ? 'members' : 'grades');

  // Grades tab cần modal rộng hơn
  const modalWidth = tab === 'grades' ? 900 : 640;

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
        borderRadius: 10, width: modalWidth, maxWidth: '96vw', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s',
      }}>
        {/* Header */}
        <div style={{
          padding: '0 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Tab: Thành viên — chỉ owner */}
            {userRole === 'owner' && (
              <button onClick={() => setTab('members')} style={tabStyle(tab === 'members')}>
                Thành viên
              </button>
            )}
            {/* Tab: Khoá học — owner + teacher */}
            <button onClick={() => setTab('enrollment')} style={tabStyle(tab === 'enrollment')}>
              Khoá học
            </button>
            {/* Tab: Bảng điểm — owner + teacher */}
            <button onClick={() => setTab('grades')} style={tabStyle(tab === 'grades')}>
              Bảng điểm
            </button>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'members' && userRole === 'owner' && <MembersTab />}
          {tab === 'enrollment' && <EnrollmentTab curriculum={curriculum || []} />}
          {tab === 'grades' && <GradesTab curriculum={curriculum || []} />}
        </div>
      </div>
    </div>
  );
}

function tabStyle(active) {
  return {
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    padding: '14px 16px', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
    transition: 'color 0.2s',
  };
}
