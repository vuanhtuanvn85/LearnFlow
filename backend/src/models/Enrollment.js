import mongoose from 'mongoose';

const EnrollmentSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId:  { type: String, required: true },
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledAt: { type: Date, default: Date.now },
});

EnrollmentSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

export default mongoose.model('Enrollment', EnrollmentSchema);
