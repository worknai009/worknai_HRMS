const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    reason: { type: String, required: true },
    year: { type: Number, required: true, index: true }
  },
  { timestamps: true }
);

// keep non-unique (avoid crash if old db has duplicates), controller will validate
HolidaySchema.index({ companyId: 1, date: 1 });

module.exports = mongoose.model('Holiday', HolidaySchema);
