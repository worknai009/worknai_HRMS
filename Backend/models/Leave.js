const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    /* ================= USER & COMPANY ================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true // Searching fast karne ke liye
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    /* ================= LEAVE DETAILS ================= */
    leaveType: {
      type: String,
      required: true,
      enum: ['Paid', 'Sick', 'Casual', 'WFH', 'Unpaid'], 
      default: 'Paid'
    },

    dayType: {
      type: String,
      enum: ['Full Day', 'Half Day'],
      default: 'Full Day'
    },

    daysCount: {
      type: Number,
      default: 1
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    /* ================= METADATA ================= */
    // ⚠️ Note: Maine yahan se unique constraints hata diye hain taaki crash na ho.
    date: {
        type: String, 
        default: () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    },

    reason: {
      type: String,
      required: true
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },

    /* ================= HR ACTION ================= */
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    actionAt: {
      type: Date,
      default: null
    },

    rejectReason: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);