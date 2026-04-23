import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: String, required: true },
  done:     { type: Boolean, default: true },
  doneAt:   { type: Date, default: Date.now },
});

ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('Progress', ProgressSchema);
