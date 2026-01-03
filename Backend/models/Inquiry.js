const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  
  // ✅ Explicit Number Types for Coordinates
  lat: { type: Number, required: true }, 
  lng: { type: Number, required: true },

  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company',
    default: null 
  },

  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', InquirySchema);