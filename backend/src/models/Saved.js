import mongoose from 'mongoose';

const SavedSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: String, required: true },
  savedAt:  { type: Date, default: Date.now },
});

SavedSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('Saved', SavedSchema);
