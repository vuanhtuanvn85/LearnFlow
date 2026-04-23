import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({ withCredentials: true });

export function useProgress(user) {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lf_done') || '[]'); } catch { return []; }
  });
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lf_saved') || '[]'); } catch { return []; }
  });

  // Sync from backend when user logs in
  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/api/progress').catch(() => ({ data: [] })),
      api.get('/api/saved').catch(() => ({ data: [] })),
    ]).then(([progRes, savedRes]) => {
      const doneIds = progRes.data.map(p => p.lessonId);
      const savedIds = savedRes.data.map(s => s.lessonId);
      setDone(doneIds);
      setSaved(savedIds);
      localStorage.setItem('lf_done', JSON.stringify(doneIds));
      localStorage.setItem('lf_saved', JSON.stringify(savedIds));
    });
  }, [user]);

  const markDone = useCallback(async (lessonId) => {
    setDone(prev => {
      const next = prev.includes(lessonId) ? prev : [...prev, lessonId];
      localStorage.setItem('lf_done', JSON.stringify(next));
      return next;
    });
    if (user) {
      await api.post(`/api/progress/${lessonId}`).catch(() => {});
    }
  }, [user]);

  const markUndone = useCallback(async (lessonId) => {
    setDone(prev => {
      const next = prev.filter(id => id !== lessonId);
      localStorage.setItem('lf_done', JSON.stringify(next));
      return next;
    });
    if (user) {
      await api.delete(`/api/progress/${lessonId}`).catch(() => {});
    }
  }, [user]);

  const toggleSaved = useCallback(async (lessonId) => {
    setSaved(prev => {
      const next = prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId];
      localStorage.setItem('lf_saved', JSON.stringify(next));
      return next;
    });
    if (user) {
      const isSaved = saved.includes(lessonId);
      if (isSaved) {
        await api.delete(`/api/saved/${lessonId}`).catch(() => {});
      } else {
        await api.post(`/api/saved/${lessonId}`).catch(() => {});
      }
    }
  }, [user, saved]);

  return { done, saved, markDone, markUndone, toggleSaved };
}
