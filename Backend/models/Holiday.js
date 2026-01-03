const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  // ✅ ADDED THIS: Holidays belong to a specific company
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  date: { 
    type: String, 
    required: true
    // ❌ REMOVED "unique: true" 
    // Reason: Different companies can have holidays on the same date.
    // Validation should be done in the Controller (check if holiday exists for THIS companyId).
  }, 
  reason: { 
    type: String, 
    required: true 
  },
  year: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);