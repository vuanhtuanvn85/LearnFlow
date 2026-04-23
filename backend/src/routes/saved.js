import { Router } from 'express';
import Saved from '../models/Saved.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/saved
router.get('/', requireAuth, async (req, res) => {
  const items = await Saved.find({ userId: req.user._id });
  res.json(items.map(s => ({ lessonId: s.lessonId, savedAt: s.savedAt })));
});

// POST /api/saved/:lessonId — toggle save
router.post('/:lessonId', requireAuth, async (req, res) => {
  const { lessonId } = req.params;
  const existing = await Saved.findOne({ userId: req.user._id, lessonId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ saved: false });
  }
  await Saved.create({ userId: req.user._id, lessonId });
  res.json({ saved: true });
});

// DELETE /api/saved/:lessonId
router.delete('/:lessonId', requireAuth, async (req, res) => {
  await Saved.deleteOne({ userId: req.user._id, lessonId: req.params.lessonId });
  res.json({ ok: true });
});

export default router;
