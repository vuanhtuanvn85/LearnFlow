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
    res.redirect(process.env.FRONTEND_URL);
  }
);

// Current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json(null);
  const { _id, name, email, avatar } = req.user;
  res.json({ id: _id, name, email, avatar });
});

// Logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
