import mongoose from 'mongoose';

const QuizResultSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId:  { type: String, required: true },
  correct:   { type: Number, required: true },
  total:     { type: Number, required: true },
  score:     { type: Number, required: true }, // thang 10, làm tròn lên
  submittedAt: { type: Date, default: Date.now },
});

// Mỗi lần nộp là 1 lần thử — không unique, cho phép làm lại
QuizResultSchema.index({ userId: 1, lessonId: 1, submittedAt: -1 });

export default mongoose.model('QuizResult', QuizResultSchema);
