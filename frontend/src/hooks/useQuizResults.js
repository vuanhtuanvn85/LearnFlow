import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({ withCredentials: true });

export function useQuizResults(user) {
  // { lessonId: { correct, total, score, submittedAt } }
  const [quizResults, setQuizResults] = useState({});

  useEffect(() => {
    if (!user) { setQuizResults({}); return; }
    api.get('/api/quiz-result').then(r => setQuizResults(r.data)).catch(() => {});
  }, [user]);

  const saveQuizResult = useCallback(async (lessonId, correct, total) => {
    const score = Math.ceil((correct / total) * 10);
    const result = { correct, total, score, submittedAt: new Date().toISOString() };
    setQuizResults(prev => ({ ...prev, [lessonId]: result }));
    if (user) {
      await api.post(`/api/quiz-result/${lessonId}`, { correct, total }).catch(() => {});
    }
    return score;
  }, [user]);

  return { quizResults, saveQuizResult };
}
