const AppSettings = require('../models/AppSettings');

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await AppSettings.findOneAndUpdate(
      { owner: req.user._id },
      { $setOnInsert: { owner: req.user._id } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const allowed = [
      'showElectricityBreakdown',
      'qrType', 'upiId', 'upiName', 'upiNote', 'customQrUrl',
      'ownerName', 'ownerPhone', 'propertyName',
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const settings = await AppSettings.findOneAndUpdate(
      { owner: req.user._id },
      { $set: updates },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
