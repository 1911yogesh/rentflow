const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    city:  { type: String, required: true, trim: true, default: 'Ahmedabad' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: houses in this area
areaSchema.virtual('houses', {
  ref:          'House',
  localField:   '_id',
  foreignField: 'area',
});

module.exports = mongoose.model('Area', areaSchema);
