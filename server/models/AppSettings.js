const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Electricity breakdown on receipt
    showElectricityBreakdown: { type: Boolean, default: true },

    // ── QR / Payment Config (NEW) ─────────────────────────────────────────────
    // 'upi' = generate QR from UPI ID  |  'custom' = show uploaded QR image URL
    qrType:          { type: String, enum: ['upi', 'custom', 'none'], default: 'none' },
    upiId:           { type: String, trim: true, default: '' },
    upiName:         { type: String, trim: true, default: '' },  // account holder name
    upiNote:         { type: String, trim: true, default: '' },  // payment note/description
    customQrUrl:     { type: String, trim: true, default: '' },  // URL to custom QR image

    // Owner info for receipt
    ownerName:       { type: String, trim: true, default: '' },
    ownerPhone:      { type: String, trim: true, default: '' },
    propertyName:    { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
