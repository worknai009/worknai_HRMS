const mongoose = require('mongoose');

const AssignedItemSchema = new mongoose.Schema(
  {
    templateItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    ownerRole: { type: String, enum: ['HR', 'Manager', 'Employee'], default: 'Employee' },

    dueAt: { type: Date, default: null },

    status: { type: String, enum: ['Pending', 'Done', 'Skipped'], default: 'Pending', index: true },
    doneAt: { type: Date, default: null },
    comment: { type: String, default: '' }
  },
  { _id: true }
);

const OnboardingAssignmentSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'OnboardingTemplate', default: null },

    status: { type: String, enum: ['Active', 'Completed'], default: 'Active', index: true },
    items: { type: [AssignedItemSchema], default: [] }
  },
  { timestamps: true }
);

OnboardingAssignmentSchema.index({ companyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('OnboardingAssignment', OnboardingAssignmentSchema);
