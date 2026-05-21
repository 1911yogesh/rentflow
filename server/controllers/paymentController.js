const Payment = require('../models/Payment');
const House   = require('../models/House');

// ── GET /api/payments ──────────────────────────────────────────────────────────
// Query params: house, month, status, page, limit
exports.getPayments = async (req, res) => {
  try {
    const { house, month, status, page = 1, limit = 50 } = req.query;

    const filter = { owner: req.user._id };
    if (house)  filter.house  = house;
    if (month)  filter.month  = month;
    if (status) filter.status = status;

    const options = {
      page:     parseInt(page),
      limit:    parseInt(limit),
      sort:     { createdAt: -1 },
      populate: { path: 'house', populate: { path: 'area', select: 'name city' } },
    };

    const result = await Payment.paginate(filter, options);

    res.json({
      success: true,
      data:        result.docs,
      total:       result.totalDocs,
      page:        result.page,
      totalPages:  result.totalPages,
    });
  } catch (err) {
    console.error('getPayments:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/payments/:id ──────────────────────────────────────────────────────
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, owner: req.user._id })
      .populate({ path: 'house', populate: { path: 'area', select: 'name city' } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/payments ─────────────────────────────────────────────────────────
exports.createPayment = async (req, res) => {
  try {
    const { houseId, month, currReading, paid, payDate, notes } = req.body;

    // Load house (must belong to this user)
    const house = await House.findOne({ _id: houseId, owner: req.user._id });
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.status !== 'occupied') return res.status(400).json({ success: false, message: 'House is vacant' });

    // Duplicate month guard
    const exists = await Payment.findOne({ house: houseId, month });
    if (exists) {
      return res.status(400).json({ success: false, message: `Record for ${month} already exists for this tenant` });
    }

    // ── Electricity calculation ────────────────────────────────────────────────
    const prevReading = house.prevReading || 0;
    const units       = Math.max(0, currReading - prevReading);
    const elecBill    = parseFloat((units * house.elecPerUnit).toFixed(2));

    // ── Total ─────────────────────────────────────────────────────────────────
    const roomRent  = house.roomRent  || 0;
    const waterBill = house.waterBill || 0;
    const prevDue   = house.prevDue   || 0;
    const totalBill = roomRent + waterBill + elecBill + prevDue;

    const paidAmount  = Math.min(paid, totalBill); // cannot over-pay beyond total in this record
    const remaining   = Math.max(0, totalBill - paidAmount);
    const status      = paidAmount >= totalBill ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    // ── Save payment ──────────────────────────────────────────────────────────
    const payment = await Payment.create({
      house:   houseId,
      owner:   req.user._id,
      month,
      roomRent,
      waterBill,
      elecBill,
      prevDue,
      totalBill,
      prevReading,
      currReading,
      units,
      perUnit:  house.elecPerUnit,
      paid:     paidAmount,
      remaining,
      status,
      payDate:  payDate ? new Date(payDate) : new Date(),
      notes:    notes || '',
    });

    // ── Update house: roll forward meter reading & due ────────────────────────
    await House.findByIdAndUpdate(houseId, {
      prevReading: currReading,
      currReading,
      prevDue:     remaining,
    });

    // Populate before returning
    await payment.populate({ path: 'house', populate: { path: 'area', select: 'name city' } });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    console.error('createPayment:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /api/payments/:id ───────────────────────────────────────────────────
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, owner: req.user._id });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    await payment.deleteOne();
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/payments/dashboard ───────────────────────────────────────────────
// Aggregated stats for current month
exports.getDashboard = async (req, res) => {
  try {
    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [thisMonthPayments, allHouses] = await Promise.all([
      Payment.find({ owner: req.user._id, month }).populate('house', 'tenantName number area').lean(),
      House.find({ owner: req.user._id }).lean(),
    ]);

    const collected  = thisMonthPayments.reduce((s, p) => s + p.paid, 0);
    const totalDue   = allHouses.reduce((s, h) => s + (h.prevDue || 0), 0);
    const occupied   = allHouses.filter((h) => h.status === 'occupied').length;
    const vacant     = allHouses.filter((h) => h.status === 'vacant').length;

    res.json({
      success: true,
      data: {
        month,
        collected,
        totalDue,
        occupied,
        vacant,
        totalHouses:     allHouses.length,
        recentPayments:  thisMonthPayments.slice(0, 5),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
