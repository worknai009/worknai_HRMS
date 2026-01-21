const mongoose = require('mongoose');

const OfficeTimingSchema = new mongoose.Schema(
  {
    startTime: { type: String, default: "09:30" },
    endTime: { type: String, default: "18:30" },
    workingHours: { type: Number, default: 9 },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  { _id: false }
);

const InquirySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },

    lat: { type: Number, required: true },
    lng: { type: Number, required: true },

    // radius chosen at inquiry time
    radius: { type: Number, default: 3000 },

    // office timing + timezone chosen at inquiry time
    officeTiming: { type: OfficeTimingSchema, default: undefined },

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },

    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', InquirySchema);
