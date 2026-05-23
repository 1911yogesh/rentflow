const mongoose = require('mongoose');

/**
 * RentRecord — One record per house per month.
 * Stores the rent slip (bill breakdown). Payments are in PaymentTransaction.
 * Status is computed dynamically from transactions but stored here for quick queries.
 */
const rentRecordSchema = new mongoose.Schema(
  {
    house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

    // Month in YYYY-MM format e.g. "2025-05"
    month: { type: String, required: true },

    // Bill components — stored with override support
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

    // Electricity meter snapshot at time of generation
    prevReading: { type: Number, default: 0 },
    currReading: { type: Number, default: 0 },
    units:       { type: Number, default: 0 },
    perUnit:     { type: Number, default: 0 },

    // Total bill amount (sum of all finals)
    totalAmount: { type: Number, required: true },

    // Status: auto-computed from transactions but cached here
    status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },

    // Total paid (cached — recomputed on each transaction change)
    totalPaid: { type: Number, default: 0 },

    // Notes on slip level
    notes: { type: String, trim: true, default: '' },

    // When slip was generated
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate record for same house + same month
rentRecordSchema.index({ house: 1, month: 1 }, { unique: true });
rentRecordSchema.index({ owner: 1, month: 1 });

module.exports = mongoose.model('RentRecord', rentRecordSchema);
