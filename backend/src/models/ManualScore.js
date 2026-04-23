import mongoose from 'mongoose';

// Điểm do giáo viên nhập tay cho bài có completion=submit
const ManualScoreSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId:  { type: String, required: true },
  score:     { type: Number, required: true, min: 0, max: 10 },
  gradedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt:  { type: Date, default: Date.now },
});

ManualScoreSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('ManualScore', ManualScoreSchema);
