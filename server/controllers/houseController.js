const House   = require('../models/House');
const Area    = require('../models/Area');
const Payment = require('../models/Payment');

// ── GET /api/houses?area=<areaId> ─────────────────────────────────────────────
exports.getHouses = async (req, res) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.area) filter.area = req.query.area;

    const houses = await House.find(filter).sort({ number: 1 });
    res.json({ success: true, data: houses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/houses/:id ────────────────────────────────────────────────────────
exports.getHouse = async (req, res) => {
  try {
    const house = await House.findOne({ _id: req.params.id, owner: req.user._id });
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    res.json({ success: true, data: house });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/houses ───────────────────────────────────────────────────────────
exports.createHouse = async (req, res) => {
  try {
    const { area, number, roomRent, waterBill, elecPerUnit } = req.body;

    // Verify area belongs to this user
    const areaDoc = await Area.findOne({ _id: area, owner: req.user._id });
    if (!areaDoc) return res.status(404).json({ success: false, message: 'Area not found' });

    const house = await House.create({
      area,
      owner: req.user._id,
      number,
      roomRent,
      waterBill:   waterBill   || 0,
      elecPerUnit: elecPerUnit || 11,
    });

    res.status(201).json({ success: true, data: house });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'House number already exists in this area' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PUT /api/houses/:id ────────────────────────────────────────────────────────
exports.updateHouse = async (req, res) => {
  try {
    const allowed = [
      'number','roomRent','waterBill','elecPerUnit',
      'tenantName','phone','altPhone','aadhaar','address','joinDate',
      'deposit','prevDue','advance','prevReading','currReading','status',
    ];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const house = await House.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    res.json({ success: true, data: house });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /api/houses/:id ─────────────────────────────────────────────────────
exports.deleteHouse = async (req, res) => {
  try {
    const house = await House.findOne({ _id: req.params.id, owner: req.user._id });
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });

    await Payment.deleteMany({ house: house._id });
    await house.deleteOne();

    res.json({ success: true, message: 'House deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/houses/:id/vacate ────────────────────────────────────────────────
exports.vacateHouse = async (req, res) => {
  try {
    const house = await House.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        status: 'vacant',
        tenantName: '', phone: '', altPhone: '', aadhaar: '', address: '',
        joinDate: null, deposit: 0, prevDue: 0, advance: 0,
      },
      { new: true }
    );
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    res.json({ success: true, data: house });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
