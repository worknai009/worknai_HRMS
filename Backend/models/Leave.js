// Backend/models/Leave.js
const mongoose = require('mongoose');

const ALLOWED_NEW_TYPES = ['Paid', 'Unpaid', 'WFH'];
const LEGACY_TYPES = ['Sick', 'Casual']; // old DB safe
const ALL_TYPES = [...ALLOWED_NEW_TYPES, ...LEGACY_TYPES];

function normalizeLeaveType(v) {
  const t = String(v || '').trim();
  if (!t) return 'Paid';

  const lower = t.toLowerCase();
  if (lower === 'paid' || lower === 'paid leave') return 'Paid';
  if (lower === 'unpaid' || lower === 'unpaid leave') return 'Unpaid';
  if (lower === 'wfh' || lower === 'work from home') return 'WFH';

  // Legacy mapping (NO NEW OPTION IN UI, but DB safe)
  if (lower === 'sick' || lower === 'casual') return 'Paid';

  return t; // will be validated by enum on save
}

const leaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    leaveType: {
      type: String,
      required: true,
      enum: ALL_TYPES, // allow legacy docs to load/save; new requests are blocked in controller
      default: 'Paid',
      index: true
    },

    dayType: { type: String, enum: ['Full Day', 'Half Day'], default: 'Full Day' },
    daysCount: { type: Number, default: 1 },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },

    // backward compatible
    date: { type: String, default: '' },

    reason: { type: String, required: true },

    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },

    actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actionAt: { type: Date, default: null },
    rejectReason: { type: String, default: "" }
  },
  { timestamps: true }
);

// ✅ normalize before validate/save (prevents "paid", "PAID", "Paid Leave")
// NOTE: keep this SYNC to avoid "next is not a function"
leaveSchema.pre('validate', function () {
  this.leaveType = normalizeLeaveType(this.leaveType);
});

leaveSchema.index({ companyId: 1, status: 1, createdAt: -1 });
leaveSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
