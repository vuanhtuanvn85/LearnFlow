import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email:    { type: String, required: true },
  name:     { type: String, required: true },
  avatar:   { type: String },
  role:     { type: String, enum: ['owner', 'teacher', 'student'], default: 'student' },
  createdAt:{ type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
