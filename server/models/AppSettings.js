const mongoose = require('mongoose');

/**
 * AppSettings — Per-user application configuration flags.
 * One document per user (upserted on first access).
 */
const appSettingsSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Feature 7: Electricity breakdown visibility
    showElectricityBreakdown: { type: Boolean, default: true },

    // Future flags can go here
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
