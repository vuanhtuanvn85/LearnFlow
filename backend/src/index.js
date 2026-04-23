import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';

import User from './models/User.js';
import authRouter from './routes/auth.js';
import progressRouter from './routes/progress.js';
import savedRouter from './routes/saved.js';
import adminRouter from './routes/admin.js';
import enrollmentRouter from './routes/enrollment.js';
import quizResultRouter from './routes/quizResult.js';
import gradesRouter from './routes/grades.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── MongoDB ────────────────────────────────────────────────
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ MongoDB connected');

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// ── Passport ───────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.BACKEND_URL + '/auth/google/callback',
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      const userCount = await User.countDocuments();
      user = await User.create({
        googleId: profile.id,
        email:    profile.emails[0].value,
        name:     profile.displayName,
        avatar:   profile.photos?.[0]?.value,
        role:     userCount === 0 ? 'owner' : 'student',
      });
    } else {
      user.name   = profile.displayName;
      user.avatar = profile.photos?.[0]?.value;
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); }
  catch (err) { done(err); }
});

app.use(passport.initialize());
app.use(passport.session());

// ── Routes ─────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);
app.use('/api/progress', progressRouter);
app.use('/api/saved', savedRouter);
app.use('/api/admin', adminRouter);
app.use('/api/enrollment', enrollmentRouter);
app.use('/api/quiz-result', quizResultRouter);
app.use('/api/grades', gradesRouter);

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Backend chạy tại http://localhost:${PORT}`));
