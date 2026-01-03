const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    /* ================= RELATIONS ================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    /* ================= DATE ================= */
    // YYYY-MM-DD format (critical for fraud prevention)
    date: {
      type: String,
      required: true,
      index: true
    },

    /* ================= TIME ================= */
    punchInTime: { type: Date, default: null },
    punchOutTime: { type: Date, default: null },

    breakTimeMinutes: { type: Number, default: 0 },

    netWorkHours: {
      type: Number,
      default: 0 // calculated (hours)
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: [
        'Not Started',
        'Present',
        'Completed',
        'On Break',
        'HalfDay',
        'Absent',
        'On Leave' // Added 'On Leave' explicitly if missing
      ],
      default: 'Not Started'
    },

    /* ================= MODE ================= */
    mode: {
      type: String,
      enum: ['Office', 'WFH', 'Manual', 'Paid Leave', 'Unpaid Leave', 'Holiday'],
      default: 'Office'
    },

    /* ================= FACE VERIFICATION ================= */
    inImage: { type: String, default: '' },   // base64 / path
    outImage: { type: String, default: '' },

    faceMatched: { type: Boolean, default: true },

    /* ================= LOCATION ================= */
    location: {
      lat: Number,
      lng: Number,
      address: String
    },

    /* ================= REPORTING (New Requirement) ================= */
    dailyReport: { type: String, default: '' }, // ✅ Added this field

    /* ================= MANUAL ENTRY (HR OVERRIDE) ================= */
    isManualEntry: { type: Boolean, default: false },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // HR/Admin who added manual entry
    },

    remarks: { type: String, default: '' },

    /* ================= FRAUD & AUDIT ================= */
    isEdited: { type: Boolean, default: false },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

/* ================= UNIQUE RULE =================
   One attendance per user per day
*/
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);