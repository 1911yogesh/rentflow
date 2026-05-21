const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema(
  {
    area:   { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
    owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    number: { type: String, required: true, trim: true },

    // Occupancy
    status: { type: String, enum: ['occupied', 'vacant'], default: 'vacant' },

    // Tenant basic info (stored here for quick access; no separate Tenant collection)
    tenantName:  { type: String, trim: true, default: '' },
    phone:       { type: String, trim: true, default: '' },
    altPhone:    { type: String, trim: true, default: '' },
    aadhaar:     { type: String, trim: true, default: '' },
    address:     { type: String, trim: true, default: '' },
    joinDate:    { type: Date },

    // Rent configuration
    roomRent:    { type: Number, required: true, default: 0 },
    waterBill:   { type: Number, default: 0 },
    elecPerUnit: { type: Number, default: 11 },

    // Meter readings
    prevReading: { type: Number, default: 0 },
    currReading: { type: Number, default: 0 },

    // Financial
    deposit:  { type: Number, default: 0 },
    prevDue:  { type: Number, default: 0 },
    advance:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound unique index – same house number cannot repeat in same area
houseSchema.index({ area: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('House', houseSchema);
