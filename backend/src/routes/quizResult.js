import { Router } from 'express';
import QuizResult from '../models/QuizResult.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/quiz-result/:lessonId — lưu kết quả
router.post('/:lessonId', requireAuth, async (req, res) => {
  try {
    const { correct, total } = req.body;
    if (typeof correct !== 'number' || typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ error: 'Thiếu hoặc sai dữ liệu correct/total' });
    }
    // Làm tròn lên: ceil(correct/total * 10)
    const score = Math.ceil((correct / total) * 10);
    const result = await QuizResult.create({
      userId: req.user._id,
      lessonId: req.params.lessonId,
      correct,
      total,
      score,
    });
    res.json({ correct, total, score, submittedAt: result.submittedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz-result/:lessonId — lấy lần nộp gần nhất
router.get('/:lessonId', requireAuth, async (req, res) => {
  try {
    const result = await QuizResult.findOne(
      { userId: req.user._id, lessonId: req.params.lessonId },
      null,
      { sort: { submittedAt: -1 } }
    );
    if (!result) return res.json(null);
    res.json({ correct: result.correct, total: result.total, score: result.score, submittedAt: result.submittedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz-result — tất cả kết quả của user (lần mới nhất mỗi bài)
router.get('/', requireAuth, async (req, res) => {
  try {
    const results = await QuizResult.aggregate([
      { $match: { userId: req.user._id } },
      { $sort: { submittedAt: -1 } },
      { $group: { _id: '$lessonId', correct: { $first: '$correct' }, total: { $first: '$total' }, score: { $first: '$score' }, submittedAt: { $first: '$submittedAt' } } },
    ]);
    // { lessonId -> { correct, total, score } }
    const map = {};
    results.forEach(r => { map[r._id] = { correct: r.correct, total: r.total, score: r.score, submittedAt: r.submittedAt }; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
