const mongoose = require('mongoose');

const AttendancePolicySchema = new mongoose.Schema(
  {
    requireGps: { type: Boolean, default: true },
    requireFace: { type: Boolean, default: true },

    allowedMethods: {
      type: [String],
      default: ['GPS_FACE', 'MANUAL_HR'],
      enum: ['GPS_FACE', 'FACE_ONLY', 'QR_FACE', 'WIFI_FACE', 'IP_FACE', 'MANUAL_HR']
    },

    // optional future
    qrSecret: { type: String, default: '' },
    allowedWifiSSIDs: { type: [String], default: [] },
    allowedIpRanges: { type: [String], default: [] },
    requireDeviceBinding: { type: Boolean, default: false }
  },
  { _id: false }
);

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logo: { type: String, default: "" },

    location: {
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },

      // dynamic (from Inquiry/superadmin)
      radius: { type: Number, default: 3000 } // meters
    },

    // office timing + timezone
    officeTiming: {
      startTime: { type: String, default: "09:30" },
      endTime: { type: String, default: "18:30" },
      workingHours: { type: Number, default: 9 },
      timeZone: { type: String, default: 'Asia/Kolkata' } // IANA
    },

    attendancePolicy: { type: AttendancePolicySchema, default: () => ({}) },

    maxHrAdmins: { type: Number, default: 1 },
    hrLimitRequest: { type: String, enum: ['None', 'Pending', 'Approved'], default: 'None' },

    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', CompanySchema);
