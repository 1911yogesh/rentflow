const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const paymentSchema = new mongoose.Schema(
  {
    house:  { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
    owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

    // Month in YYYY-MM format  e.g. "2025-05"
    month: { type: String, required: true },

    // Bill components
    roomRent:  { type: Number, required: true },
    waterBill: { type: Number, default: 0 },
    elecBill:  { type: Number, default: 0 },
    prevDue:   { type: Number, default: 0 },
    totalBill: { type: Number, required: true },

    // Meter snapshot
    prevReading: { type: Number, default: 0 },
    currReading: { type: Number, default: 0 },
    units:       { type: Number, default: 0 },
    perUnit:     { type: Number, default: 0 },

    // Payment
    paid:      { type: Number, required: true, default: 0 },
    remaining: { type: Number, default: 0 },
    status:    { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
    payDate:   { type: Date },
    notes:     { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate record for same house + same month
paymentSchema.index({ house: 1, month: 1 }, { unique: true });
paymentSchema.index({ owner: 1, month: 1 });

paymentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Payment', paymentSchema);
