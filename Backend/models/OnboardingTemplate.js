const mongoose = require('mongoose');

const OnboardingItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    dueDays: { type: Number, default: 0 },

    ownerRole: { type: String, enum: ['HR', 'Manager', 'Employee'], default: 'Employee' },

    requiresAck: { type: Boolean, default: false },

    attachments: [
      {
        type: { type: String, enum: ['file', 'link'] },
        url: { type: String, default: '' },
        name: { type: String, default: '' }
      }
    ]
  },
  { _id: true }
);

const OnboardingTemplateSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    items: { type: [OnboardingItemSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

OnboardingTemplateSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('OnboardingTemplate', OnboardingTemplateSchema);
