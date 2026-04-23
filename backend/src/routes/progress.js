import { Router } from 'express';
import Progress from '../models/Progress.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/progress — all done lessons for user
router.get('/', requireAuth, async (req, res) => {
  const items = await Progress.find({ userId: req.user._id, done: true });
  res.json(items.map(p => ({ lessonId: p.lessonId, doneAt: p.doneAt })));
});

// POST /api/progress/:lessonId — mark done
router.post('/:lessonId', requireAuth, async (req, res) => {
  const { lessonId } = req.params;
  await Progress.findOneAndUpdate(
    { userId: req.user._id, lessonId },
    { done: true, doneAt: new Date() },
    { upsert: true, new: true }
  );
  res.json({ ok: true });
});

export default router;
