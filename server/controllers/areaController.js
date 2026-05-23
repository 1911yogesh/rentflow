const Area  = require('../models/Area');
const House = require('../models/House');
const Payment = require('../models/Payment');
const RentRecord = require('../models/RentRecord');
const PaymentTransaction = require('../models/PaymentTransaction');

// ── GET /api/areas ─────────────────────────────────────────────────────────────
// Returns all areas for logged-in user, enriched with house/due stats
exports.getAreas = async (req, res) => {
  try {
    const areas = await Area.find({ owner: req.user._id }).sort({ createdAt: -1 });

    // Enrich each area with stats from houses
    const enriched = await Promise.all(
      areas.map(async (area) => {
        const houses   = await House.find({ area: area._id, owner: req.user._id });
        const occupied = houses.filter((h) => h.status === 'occupied').length;
        const vacant   = houses.length - occupied;
        const records = await RentRecord.find({ owner: req.user._id, house: { $in: houses.map((h) => h._id) } }).lean();
        const pendingDue = records.reduce((s, r) => s + Math.max(0, (r.totalAmount || 0) - (r.totalPaid || 0)), 0);

        return {
          ...area.toObject(),
          totalHouses: houses.length,
          occupied,
          vacant,
          pendingDue,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('getAreas:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/areas ────────────────────────────────────────────────────────────
exports.createArea = async (req, res) => {
  try {
    const { name, city } = req.body;
    const area = await Area.create({ name, city: city || 'Ahmedabad', owner: req.user._id });
    res.status(201).json({ success: true, data: { ...area.toObject(), totalHouses: 0, occupied: 0, vacant: 0, pendingDue: 0 } });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Area name already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PUT /api/areas/:id ─────────────────────────────────────────────────────────
exports.updateArea = async (req, res) => {
  try {
    const area = await Area.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name: req.body.name, city: req.body.city },
      { new: true, runValidators: true }
    );
    if (!area) return res.status(404).json({ success: false, message: 'Area not found' });
    res.json({ success: true, data: area });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /api/areas/:id ──────────────────────────────────────────────────────
exports.deleteArea = async (req, res) => {
  try {
    const area = await Area.findOne({ _id: req.params.id, owner: req.user._id });
    if (!area) return res.status(404).json({ success: false, message: 'Area not found' });

    const houses = await House.find({ area: area._id, owner: req.user._id }).select('_id');
    const houseIds = houses.map((h) => h._id);
    const records = await RentRecord.find({ house: { $in: houseIds }, owner: req.user._id }).select('_id');
    const recordIds = records.map((r) => r._id);

    await PaymentTransaction.deleteMany({ rentRecord: { $in: recordIds }, owner: req.user._id });
    await RentRecord.deleteMany({ _id: { $in: recordIds }, owner: req.user._id });
    await Payment.deleteMany({ house: { $in: houseIds }, owner: req.user._id });
    await House.deleteMany({ area: area._id, owner: req.user._id });
    await area.deleteOne();

    res.json({ success: true, message: 'Area deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
