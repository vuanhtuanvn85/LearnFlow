import { Router } from 'express';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

function requireStaff(req, res, next) {
  if (!['owner', 'teacher'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// GET /api/enrollment/my — danh sách subjectId mà user hiện tại đã được enroll
router.get('/my', requireAuth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id }, 'subjectId');
    res.json(enrollments.map(e => e.subjectId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/enrollment/:subjectId — danh sách student đã enrol
router.get('/:subjectId', requireAuth, requireStaff, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ subjectId: req.params.subjectId })
      .populate('userId', 'name email avatar role')
      .sort({ enrolledAt: 1 });

    res.json(enrollments.map(e => ({
      enrollmentId: e._id,
      user: e.userId,
      enrolledAt: e.enrolledAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enrollment/:subjectId/import — import danh sách email (mỗi dòng 1 email)
router.post('/:subjectId/import', requireAuth, requireStaff, async (req, res) => {
  try {
    const { emails } = req.body; // array of strings
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Cần truyền mảng emails' });
    }

    const normalized = emails
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@'));

    if (normalized.length === 0) {
      return res.status(400).json({ error: 'Không có email hợp lệ' });
    }

    // Tìm các user có email khớp
    const users = await User.find({ email: { $in: normalized } }, '_id email');
    const userMap = Object.fromEntries(users.map(u => [u.email.toLowerCase(), u._id]));

    const results = { enrolled: [], notFound: [], alreadyEnrolled: [] };

    for (const email of normalized) {
      const userId = userMap[email];
      if (!userId) {
        results.notFound.push(email);
        continue;
      }
      try {
        await Enrollment.create({
          userId,
          subjectId: req.params.subjectId,
          enrolledBy: req.user._id,
        });
        results.enrolled.push(email);
      } catch (err) {
        if (err.code === 11000) {
          results.alreadyEnrolled.push(email);
        } else {
          throw err;
        }
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/enrollment/:subjectId/:enrollmentId — remove 1 student
router.delete('/:subjectId/:enrollmentId', requireAuth, requireStaff, async (req, res) => {
  try {
    const deleted = await Enrollment.findOneAndDelete({
      _id: req.params.enrollmentId,
      subjectId: req.params.subjectId,
    });
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy enrollment' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/enrollment/:subjectId/export — export CSV
router.get('/:subjectId/export', requireAuth, requireStaff, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ subjectId: req.params.subjectId })
      .populate('userId', 'name email')
      .sort({ enrolledAt: 1 });

    const lines = ['name,email,enrolledAt'];
    for (const e of enrollments) {
      const name = `"${(e.userId.name || '').replace(/"/g, '""')}"`;
      lines.push(`${name},${e.userId.email},${e.enrolledAt.toISOString()}`);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="enrollment-${req.params.subjectId}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
