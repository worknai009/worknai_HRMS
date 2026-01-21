const mongoose = require('mongoose');

const FileOrLinkSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['file', 'link'], required: true },

    url: { type: String, required: true },
    name: { type: String, default: '' },

    // only for file
    mime: { type: String, default: '' },
    size: { type: Number, default: 0 },
    sha256: { type: String, default: '' }
  },
  { _id: true }
);

const TaskSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium', index: true },
    deadline: { type: Date, required: true, index: true },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      // controller uses Needs Rework + Rejected + Verified
      enum: ['Pending', 'In Progress', 'Completed', 'Verified', 'Rejected', 'Needs Rework'],
      default: 'Pending',
      index: true
    },

    // HR attachments
    attachments: { type: [FileOrLinkSchema], default: [] },

    // Employee submission
    submission: {
      notes: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
      attachments: { type: [FileOrLinkSchema], default: [] }
    },

    // HR review
    review: {
      status: { type: String, enum: ['None', 'Approved', 'Rejected', 'Needs Rework'], default: 'None' },
      comment: { type: String, default: '' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

TaskSchema.index({ companyId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Task', TaskSchema);
