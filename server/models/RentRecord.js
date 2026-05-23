const mongoose = require('mongoose');

const rentRecordSchema = new mongoose.Schema(
  {
    house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

    month: { type: String, required: true },

    roomRent: {
      auto:      { type: Number, default: 0 },
      final:     { type: Number, default: 0 },
      overridden:{ type: Boolean, default: false },
    },
    waterBill: {
      auto:      { type: Number, default: 0 },
      final:     { type: Number, default: 0 },
      overridden:{ type: Boolean, default: false },
    },
    elecBill: {
      auto:      { type: Number, default: 0 },
      final:     { type: Number, default: 0 },
      overridden:{ type: Boolean, default: false },
    },
    previousDue: {
      auto:      { type: Number, default: 0 },
      final:     { type: Number, default: 0 },
      overridden:{ type: Boolean, default: false },
    },

    // ── Electricity snapshot (NEW: elecType stored at bill-time) ─────────────
    elecType:    { type: String, enum: ['per_unit', 'fixed'], default: 'per_unit' },
    prevReading: { type: Number, default: 0 },
    currReading: { type: Number, default: 0 },
    units:       { type: Number, default: 0 },
    perUnit:     { type: Number, default: 0 },
    elecFixed:   { type: Number, default: 0 },   // snapshot of fixed amount if elecType='fixed'

    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    totalPaid: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: '' },
    generatedAt: { type: Date, default: Date.now },

    // ── Receipt ID (NEW) ─────────────────────────────────────────────────────
    receiptId: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

rentRecordSchema.index({ house: 1, month: 1 }, { unique: true });
rentRecordSchema.index({ owner: 1, month: 1 });

module.exports = mongoose.model('RentRecord', rentRecordSchema);
