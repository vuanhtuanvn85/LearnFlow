import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import Topbar from './components/Topbar';
import { useProgress } from './hooks/useProgress';

const api = axios.create({ withCredentials: true });

export default function App() {
  const [curriculum, setCurriculum] = useState([]);
  const [currentId, setCurrentId] = useState(() => localStorage.getItem('lf_lastLesson') || null);
  const [user, setUser] = useState(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState(null); // null = chưa load
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { done, saved, markDone, toggleSaved } = useProgress(user);

  // Load content.json
  useEffect(() => {
    fetch('/learnflow/content.json')
      .then(r => r.json())
      .then(data => {
        const valid = (data.curriculum || []).filter(s => s.id && s.title);
        setCurriculum(valid);
        const last = localStorage.getItem('lf_lastLesson');
        if (!last) {
          const first = valid[0]?.sessions[0]?.lessons[0];
          if (first) setCurrentId(first.id);
        }
      })
      .catch(console.error);
  }, []);

  // Check auth
  useEffect(() => {
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => setUser(null));
  }, []);

  // Fetch enrolled subjects khi user là student
  useEffect(() => {
    if (!user) { setEnrolledSubjects(null); return; }
    if (user.role !== 'student') { setEnrolledSubjects(null); return; }
    api.get('/api/enrollment/my')
      .then(r => setEnrolledSubjects(r.data))
      .catch(() => setEnrolledSubjects([]));
  }, [user]);

  const selectLesson = useCallback((id) => {
    setCurrentId(id);
    localStorage.setItem('lf_lastLesson', id);
  }, []);

  // Curriculum được lọc theo enrollment (chỉ áp dụng cho student)
  const visibleCurriculum = useMemo(() => {
    if (!user || user.role !== 'student') return curriculum;
    if (enrolledSubjects === null) return []; // đang load
    return curriculum.filter(s => enrolledSubjects.includes(s.id));
  }, [curriculum, user, enrolledSubjects]);

  // Flatten all lessons (chỉ từ môn được phép xem)
  const allLessons = useMemo(() => {
    const list = [];
    visibleCurriculum.forEach(sub => sub.sessions.forEach(ses => ses.lessons.forEach(l => list.push(l))));
    return list;
  }, [visibleCurriculum]);

  // Reset về bài đầu tiên nếu currentId không thuộc môn được phép xem
  useEffect(() => {
    if (allLessons.length === 0) return;
    if (!currentId || !allLessons.find(l => l.id === currentId)) {
      selectLesson(allLessons[0].id);
    }
  }, [allLessons, currentId, selectLesson]);

  const currentIndex = useMemo(() => allLessons.findIndex(l => l.id === currentId), [allLessons, currentId]);
  const currentLesson = allLessons[currentIndex] ?? null;

  const goPrev = useCallback(() => {
    if (currentIndex > 0) selectLesson(allLessons[currentIndex - 1].id);
  }, [currentIndex, allLessons, selectLesson]);

  const goNext = useCallback(() => {
    if (currentIndex < allLessons.length - 1) selectLesson(allLessons[currentIndex + 1].id);
  }, [currentIndex, allLessons, selectLesson]);

  // Keyboard shortcuts: ← → S
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if ((e.key === 's' || e.key === 'S') && currentId) toggleSaved(currentId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext, currentId, toggleSaved]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} totalDone={done.length} totalLessons={allLessons.length} curriculum={curriculum} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Mobile toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            display: window.innerWidth < 768 ? 'flex' : 'none',
            position: 'fixed', bottom: 16, left: 16, zIndex: 100,
            background: 'var(--accent)', border: 'none', color: '#fff',
            borderRadius: '50%', width: 44, height: 44, fontSize: 18, cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          ☰
        </button>

        {sidebarOpen && (
          <Sidebar
            curriculum={visibleCurriculum}
            currentId={currentId}
            done={done}
            saved={saved}
            onSelect={selectLesson}
          />
        )}

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {user?.role === 'student' && enrolledSubjects !== null && enrolledSubjects.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              color: 'var(--text-muted)', fontSize: 14,
            }}>
              <div style={{ fontSize: 32 }}>📭</div>
              <div>Bạn chưa được đăng ký vào khoá học nào.</div>
              <div style={{ fontSize: 12 }}>Vui lòng liên hệ giáo viên để được thêm vào khoá học.</div>
            </div>
          ) : (
            <ContentArea
              lesson={currentLesson}
              allLessons={allLessons}
              currentIndex={currentIndex < 0 ? 0 : currentIndex}
              onPrev={goPrev}
              onNext={goNext}
              onMarkDone={markDone}
              onToggleSaved={toggleSaved}
              done={done}
              saved={saved}
            />
          )}
        </main>
      </div>
    </div>
  );
}
