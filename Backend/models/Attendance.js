const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    // YYYY-MM-DD (company timezone)
    date: { type: String, required: true, index: true },

    punchInTime: { type: Date, default: null },
    punchOutTime: { type: Date, default: null },

    breakStartAt: { type: Date, default: null },
    totalBreakMinutes: { type: Number, default: 0 },

    // old compatibility
    breakTimeMinutes: { type: Number, default: 0 },

    netWorkHours: {
      type: Number,
      default: 0,
      set: (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
    },

    status: {
      type: String,
      enum: ['Not Started', 'Present', 'Completed', 'On Break', 'HalfDay', 'Absent', 'On Leave', 'Holiday'],
      default: 'Not Started',
      index: true
    },

    mode: {
      type: String,
      enum: ['Office', 'WFH', 'Manual', 'Paid Leave', 'Unpaid Leave', 'Holiday', 'Leave'],
      default: 'Office',
      index: true
    },

    source: {
      type: String,
      enum: ['GPS_FACE', 'FACE_ONLY', 'QR_FACE', 'WIFI_FACE', 'IP_FACE', 'MANUAL_HR', 'SYSTEM'],
      default: 'GPS_FACE',
      index: true
    },

    inImage: { type: String, default: '' },
    outImage: { type: String, default: '' },

    faceMatched: { type: Boolean, default: true },

    location: {
      lat: Number,
      lng: Number,
      address: String
    },

    dailyReport: { type: String, default: '' },
    plannedTasks: { type: String, default: '' },

    isManualEntry: { type: Boolean, default: false },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' },

    isEdited: { type: Boolean, default: false },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

// one user one day attendance (company timezone based date string)
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
