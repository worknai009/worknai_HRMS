const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    title: { type: String, required: true, trim: true },
    department: { type: String, default: '' },
    location: { type: String, default: '' },
    employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Internship'], default: 'Full-time' },
    openings: { type: Number, default: 1 },

    // ✅ Added Fields
    contactEmail: { type: String, trim: true },
    experience: { type: String, default: 'Fresher' },
    passingYear: { type: String, default: '' },
    education: { type: String, default: '' }, // ✅ NEW
    salaryRange: { type: String, default: '' },
    deadline: { type: Date, default: null }, // ✅ NEW

    description: { type: String, default: '' },
    skills: { type: [String], default: [] },

    status: { type: String, enum: ['Open', 'Closed', 'On Hold'], default: 'Open', index: true }
  },
  { timestamps: true }
);

JobSchema.index({ companyId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Job', JobSchema);