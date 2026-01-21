const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    radius: { type: Number, default: 5000 }
  },
  { _id: true }
);

const SystemSettingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },

    validLocations: { type: [LocationSchema], default: [] },

    allowMobileAttendance: { type: Boolean, default: true },
    officeStartTime: { type: String, default: "09:30" }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
