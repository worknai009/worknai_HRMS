const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Mumbai Branch"
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radius: { type: Number, default: 3000 }
});

const SystemSettingsSchema = new mongoose.Schema({
  // ✅ ADDED: Link settings to a specific company
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
  
  validLocations: [LocationSchema], 
  
  // You can add other company-specific settings here later
  allowMobileAttendance: { type: Boolean, default: true },
  officeStartTime: { type: String, default: "09:30" }

}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);