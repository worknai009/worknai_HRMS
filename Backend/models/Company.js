const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  logo: { type: String, default: "" }, // ✅ New: Logo Path
  
  location: {
    address: String,
    lat: Number,
    lng: Number,
    radius: { type: Number, default: 3000 }
  },

  maxHrAdmins: { type: Number, default: 1 },
  hrLimitRequest: { type: String, enum: ['None', 'Pending', 'Approved'], default: 'None' }, // ✅ New: Request Status

  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);