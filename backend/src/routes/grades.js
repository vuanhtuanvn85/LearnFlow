import { Router } from 'express';
import Enrollment from '../models/Enrollment.js';
import QuizResult from '../models/QuizResult.js';
import ManualScore from '../models/ManualScore.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

function requireStaff(req, res, next) {
  if (!['owner', 'teacher'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

/**
 * GET /api/grades/:subjectId?lessons=<json>
 * lessons = JSON-encoded array of { id, title, completion } for this subject
 * Returns: { students: [{userId,name,email}], lessons: [{id,title,completion}], scores: {userId: {lessonId: score|null}} }
 */
router.get('/:subjectId', requireAuth, requireStaff, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Parse lessons list from query param (sent by frontend from content.json)
    let lessons = [];
    try {
      lessons = JSON.parse(req.query.lessons || '[]');
    } catch {
      return res.status(400).json({ error: 'lessons param invalid JSON' });
    }

    // Only keep lessons that need grading (quiz:N or submit)
    const gradedLessons = lessons.filter(l => l.completion && l.completion !== '');

    // Students enrolled in this subject
    const enrollments = await Enrollment.find({ subjectId })
      .populate('userId', 'name email avatar')
      .sort({ enrolledAt: 1 });

    const students = enrollments.map(e => ({
      userId: String(e.userId._id),
      name: e.userId.name,
      email: e.userId.email,
      avatar: e.userId.avatar,
    }));

    const userIds = students.map(s => s.userId);
    const lessonIds = gradedLessons.map(l => l.id);

    // Quiz results — latest per (userId, lessonId)
    const quizResults = await QuizResult.aggregate([
      { $match: { userId: { $in: enrollments.map(e => e.userId._id) }, lessonId: { $in: lessonIds } } },
      { $sort: { submittedAt: -1 } },
      { $group: { _id: { userId: '$userId', lessonId: '$lessonId' }, score: { $first: '$score' }, correct: { $first: '$correct' }, total: { $first: '$total' } } },
    ]);

    // Manual scores for submit lessons
    const manualScores = await ManualScore.find({
      userId: { $in: enrollments.map(e => e.userId._id) },
      lessonId: { $in: lessonIds },
    });

    // Build score matrix: { userId: { lessonId: { score, type } } }
    const scores = {};
    for (const uid of userIds) scores[uid] = {};

    for (const r of quizResults) {
      const uid = String(r._id.userId);
      if (scores[uid]) {
        scores[uid][r._id.lessonId] = { score: r.score, correct: r.correct, total: r.total, type: 'quiz' };
      }
    }

    for (const m of manualScores) {
      const uid = String(m.userId);
      if (scores[uid]) {
        scores[uid][m.lessonId] = { score: m.score, type: 'manual', gradedAt: m.gradedAt };
      }
    }

    res.json({ students, lessons: gradedLessons, scores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/grades/:subjectId/:userId/:lessonId
 * Body: { score: number }
 * Upsert manual score for a submit-type lesson
 */
router.patch('/:subjectId/:userId/:lessonId', requireAuth, requireStaff, async (req, res) => {
  try {
    const { userId, lessonId } = req.params;
    const { score } = req.body;

    if (typeof score !== 'number' || score < 0 || score > 10) {
      return res.status(400).json({ error: 'score phải là số từ 0 đến 10' });
    }

    const result = await ManualScore.findOneAndUpdate(
      { userId, lessonId },
      { score, gradedBy: req.user._id, gradedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ score: result.score, gradedAt: result.gradedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/grades/:subjectId/export?lessons=<json>
 * CSV export: Name, Email, [lesson columns...]
 */
router.get('/:subjectId/export', requireAuth, requireStaff, async (req, res) => {
  try {
    const { subjectId } = req.params;
    let lessons = [];
    try { lessons = JSON.parse(req.query.lessons || '[]'); } catch { /* ignore */ }

    const gradedLessons = lessons.filter(l => l.completion && l.completion !== '');

    const enrollments = await Enrollment.find({ subjectId })
      .populate('userId', 'name email')
      .sort({ enrolledAt: 1 });

    const userIds = enrollments.map(e => e.userId._id);
    const lessonIds = gradedLessons.map(l => l.id);

    const quizResults = await QuizResult.aggregate([
      { $match: { userId: { $in: userIds }, lessonId: { $in: lessonIds } } },
      { $sort: { submittedAt: -1 } },
      { $group: { _id: { userId: '$userId', lessonId: '$lessonId' }, score: { $first: '$score' } } },
    ]);

    const manualScores = await ManualScore.find({ userId: { $in: userIds }, lessonId: { $in: lessonIds } });

    // Build lookup
    const scoreMap = {}; // userId_lessonId -> score
    for (const r of quizResults) {
      scoreMap[`${r._id.userId}_${r._id.lessonId}`] = r.score;
    }
    for (const m of manualScores) {
      scoreMap[`${m.userId}_${m.lessonId}`] = m.score;
    }

    // CSV
    const escCsv = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const header = ['Họ tên', 'Email', ...gradedLessons.map(l => l.title)];
    const rows = enrollments.map(e => {
      const uid = e.userId._id;
      const cells = gradedLessons.map(l => {
        const s = scoreMap[`${uid}_${l.id}`];
        return s != null ? s : '';
      });
      return [escCsv(e.userId.name), escCsv(e.userId.email), ...cells];
    });

    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="grades-${subjectId}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
