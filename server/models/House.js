const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema(
  {
    area:   { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
    owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    number: { type: String, required: true, trim: true },

    // Occupancy
    status: { type: String, enum: ['occupied', 'vacant'], default: 'vacant' },

    // Tenant info
    tenantName:  { type: String, trim: true, default: '' },
    phone:       { type: String, trim: true, default: '' },
    altPhone:    { type: String, trim: true, default: '' },

    // ── WhatsApp Sharing (NEW) ────────────────────────────────────────────────
    countryCode:     { type: String, trim: true, default: '91' },   // dial code, no '+'
    whatsappNumber:  { type: String, trim: true, default: '' },      // falls back to `phone` if empty
    aadhaar:     { type: String, trim: true, default: '' },
    address:     { type: String, trim: true, default: '' },
    joinDate:    { type: Date },

    // Rent configuration
    roomRent:    { type: Number, required: true, default: 0 },
    waterBill:   { type: Number, default: 0 },

    // ── Electricity Configuration (NEW) ──────────────────────────────────────
    // 'per_unit' = (curr - prev) × rate  |  'fixed' = flat fixed amount
    elecType:    { type: String, enum: ['per_unit', 'fixed'], default: 'per_unit' },
    elecPerUnit: { type: Number, default: 11 },   // used when elecType = 'per_unit'
    elecFixed:   { type: Number, default: 0 },    // used when elecType = 'fixed'

    // Meter readings (used when elecType = 'per_unit')
    prevReading: { type: Number, default: 0 },
    currReading: { type: Number, default: 0 },

    // Financial
    deposit:  { type: Number, default: 0 },
    prevDue:  { type: Number, default: 0 },
    advance:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

houseSchema.index({ area: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('House', houseSchema);
