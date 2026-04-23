import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// GET /api/admin/members — danh sách thành viên
router.get('/members', requireAuth, requireOwner, async (req, res) => {
  try {
    const users = await User.find({}, 'name email avatar role createdAt').sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/members/:id — đổi role
router.patch('/members/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role phải là teacher hoặc student' });
    }
    // Không cho đổi role của owner
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User không tồn tại' });
    if (target.role === 'owner') return res.status(403).json({ error: 'Không thể đổi role của Owner' });

    target.role = role;
    await target.save();
    res.json({ id: target._id, name: target.name, role: target.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
