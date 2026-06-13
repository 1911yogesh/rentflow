const House   = require('../models/House');
const Area    = require('../models/Area');
const Payment = require('../models/Payment');
const RentRecord = require('../models/RentRecord');
const PaymentTransaction = require('../models/PaymentTransaction');

// ── GET /api/houses?area=<areaId> ─────────────────────────────────────────────
exports.getHouses = async (req, res) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.area) filter.area = req.query.area;

    const houses = await House.find(filter)
      .populate('area', 'name city')   // populate area so house.area.name is available
      .sort({ number: 1 });
    res.json({ success: true, data: houses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/houses/:id ────────────────────────────────────────────────────────
exports.getHouse = async (req, res) => {
  try {
    const house = await House.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('area', 'name city');  // populate area so house.area.name is available
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    res.json({ success: true, data: house });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/houses ───────────────────────────────────────────────────────────
exports.createHouse = async (req, res) => {
  try {
    const { area, number, roomRent, waterBill, elecType, elecPerUnit, elecFixed } = req.body;

    const areaDoc = await Area.findOne({ _id: area, owner: req.user._id });
    if (!areaDoc) return res.status(404).json({ success: false, message: 'Area not found' });

    const house = await House.create({
      area,
      owner: req.user._id,
      number,
      roomRent,
      waterBill:   waterBill   || 0,
      elecType:    elecType || 'per_unit',
      elecPerUnit: elecPerUnit || 11,
      elecFixed:   elecFixed || 0,
    });

    // Return with area populated
    const populated = await House.findById(house._id).populate('area', 'name city');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'House number already exists in this area' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PUT /api/houses/:id ────────────────────────────────────────────────────────
exports.updateHouse = async (req, res) => {
  try {
    const allowed = [
      'number','roomRent','waterBill','elecType','elecPerUnit','elecFixed',
      'tenantName','phone','altPhone','aadhaar','address','joinDate',
      'deposit','prevDue','advance','prevReading','currReading','status',
      'countryCode','whatsappNumber',
    ];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const house = await House.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('area', 'name city');  // populate area on update response too

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

    const records = await RentRecord.find({ house: house._id, owner: req.user._id }).select('_id');
    const recordIds = records.map((r) => r._id);
    await PaymentTransaction.deleteMany({ rentRecord: { $in: recordIds }, owner: req.user._id });
    await RentRecord.deleteMany({ _id: { $in: recordIds }, owner: req.user._id });
    await Payment.deleteMany({ house: house._id, owner: req.user._id });
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
        countryCode: '91', whatsappNumber: '',
        joinDate: null, deposit: 0, prevDue: 0, advance: 0,
      },
      { new: true }
    ).populate('area', 'name city');

    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    res.json({ success: true, data: house });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/houses/:id/due ────────────────────────────────────────────────────
exports.getHouseDue = async (req, res) => {
  try {
    const house = await House.findOne({ _id: req.params.id, owner: req.user._id });
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });

    const lastRecord = await RentRecord.findOne({
      house: house._id,
      status: { $in: ['unpaid', 'partial'] },
    }).sort({ month: -1 });

    let currentDue = 0;
    if (lastRecord) {
      const txns = await PaymentTransaction.find({ rentRecord: lastRecord._id }).lean();
      const paid = txns.reduce((s, t) => s + t.amount, 0);
      currentDue = Math.max(0, lastRecord.totalAmount - paid);
    }

    res.json({ success: true, data: { due: currentDue } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
