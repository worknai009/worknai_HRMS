const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },

    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 30 },

    mode: { type: String, enum: ['In-Person', 'Video', 'Phone'], default: 'Video' },
    meetingLink: { type: String, default: '' },
    location: { type: String, default: '' },

    interviewers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'], default: 'Scheduled' },
    notes: { type: String, default: '' },
    result: { type: String, enum: ['Pending', 'Pass', 'Fail', 'Hold'], default: 'Pending' },

    // ✅ Candidate Response
    candidateResponse: { type: String, enum: ['Pending', 'Confirmed', 'Declined', 'RescheduleRequested'], default: 'Pending' },
    candidateResponseNote: { type: String, default: '' }
  },
  { timestamps: true }
);

InterviewSchema.index({ companyId: 1, scheduledAt: 1 });

module.exports = mongoose.model('Interview', InterviewSchema);
