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

  // Flatten all lessons
  const allLessons = useMemo(() => {
    const list = [];
    curriculum.forEach(sub => sub.sessions.forEach(ses => ses.lessons.forEach(l => list.push(l))));
    return list;
  }, [curriculum]);

  const currentIndex = useMemo(() => allLessons.findIndex(l => l.id === currentId), [allLessons, currentId]);
  const currentLesson = allLessons[currentIndex] ?? null;

  const selectLesson = useCallback((id) => {
    setCurrentId(id);
    localStorage.setItem('lf_lastLesson', id);
  }, []);

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
      <Topbar user={user} totalDone={done.length} totalLessons={allLessons.length} />
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
            curriculum={curriculum}
            currentId={currentId}
            done={done}
            saved={saved}
            onSelect={selectLesson}
          />
        )}

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
        </main>
      </div>
    </div>
  );
}
