import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

function makeToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Redirect to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Google callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}?error=auth_failed`, session: false }),
  (req, res) => {
    const token = makeToken(req.user);
    console.log('[auth] callback OK, user:', req.user?.email, '| token issued');
    const frontendUrl = process.env.FRONTEND_URL;
    // Truyền token qua URL → frontend lưu vào localStorage
    res.redirect(`${frontendUrl}?token=${token}`);
  }
);

// Current user — đọc từ JWT header hoặc query token
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    console.log('[auth] /me | no token');
    return res.status(401).json(null);
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('[auth] /me | OK, user:', payload.email);
    res.json({ id: payload.id, name: payload.name, email: payload.email, avatar: payload.avatar, role: payload.role });
  } catch (err) {
    console.log('[auth] /me | invalid token:', err.message);
    res.status(401).json(null);
  }
});

// Logout — chỉ cần frontend xoá token, không cần làm gì ở backend
router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

export default router;
