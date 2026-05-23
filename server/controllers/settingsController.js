const AppSettings = require('../models/AppSettings');

exports.getSettings = async (req, res) => {
  try {
    let settings = await AppSettings.findOne({ owner: req.user._id });
    if (!settings) {
      settings = await AppSettings.create({ owner: req.user._id });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const allowed = ['showElectricityBreakdown'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const settings = await AppSettings.findOneAndUpdate(
      { owner: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
