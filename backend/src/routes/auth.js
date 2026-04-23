import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Redirect to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Google callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}?error=auth_failed` }),
  (req, res) => {
    // Trả HTML page thay vì redirect thẳng để browser lưu cookie trước khi chuyển trang
    const frontendUrl = process.env.FRONTEND_URL;
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
<script>window.location.href = ${JSON.stringify(frontendUrl)};</script>
</head><body>Đang chuyển hướng...</body></html>`);
  }
);

// Current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json(null);
  const { _id, name, email, avatar, role } = req.user;
  res.json({ id: _id, name, email, avatar, role });
});

// Logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
