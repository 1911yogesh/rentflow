const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * PaymentTransaction — Each payment made against a RentRecord.
 * Supports partial/multiple payments.
 */
const paymentTransactionSchema = new mongoose.Schema(
  {
    rentRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'RentRecord', required: true },
    house:      { type: mongoose.Schema.Types.ObjectId, ref: 'House',      required: true },
    owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },

    amount:        { type: Number, required: true, min: 0.01 },
    paymentDate:   { type: Date, default: Date.now },
    paymentMethod: {
      type:    String,
      enum:    ['cash', 'upi', 'bank_transfer', 'cheque', 'other'],
      default: 'cash',
    },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ rentRecord: 1 });
paymentTransactionSchema.index({ house: 1 });
paymentTransactionSchema.index({ owner: 1 });

paymentTransactionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
