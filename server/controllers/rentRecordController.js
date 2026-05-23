const RentRecord          = require('../models/RentRecord');
const PaymentTransaction  = require('../models/PaymentTransaction');
const House               = require('../models/House');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recompute totalPaid + status for a RentRecord from its transactions.
 * Saves the record.  Returns updated record.
 */
async function syncRecordStatus(recordId) {
  const txns = await PaymentTransaction.find({ rentRecord: recordId }).lean();
  const totalPaid = txns.reduce((s, t) => s + t.amount, 0);
  const record    = await RentRecord.findById(recordId);
  if (!record) return null;

  record.totalPaid = totalPaid;
  const remaining  = record.totalAmount - totalPaid;
  record.status    = remaining <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
  await record.save();
  return record;
}

/**
 * Build a populated record with transactions attached.
 */
async function populatedRecord(recordId) {
  const record = await RentRecord.findById(recordId)
    .populate({ path: 'house', populate: { path: 'area', select: 'name city' } })
    .lean();
  if (!record) return null;
  const transactions = await PaymentTransaction.find({ rentRecord: recordId })
    .sort({ paymentDate: 1 })
    .lean();
  return { ...record, transactions };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rent-records  — list, filterable
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecords = async (req, res) => {
  try {
    const { house, month, status, page = 1, limit = 50 } = req.query;
    const filter = { owner: req.user._id };
    if (house)  filter.house  = house;
    if (month)  filter.month  = month;
    if (status) filter.status = status;

    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const total  = await RentRecord.countDocuments(filter);
    const docs   = await RentRecord.find(filter)
      .sort({ month: -1, createdAt: -1 })
      .skip(skip).limit(parseInt(limit))
      .populate({ path: 'house', populate: { path: 'area', select: 'name city' } })
      .lean();

    // Attach transactions to each
    const ids = docs.map((d) => d._id);
    const allTxns = await PaymentTransaction.find({ rentRecord: { $in: ids } }).lean();
    const txnMap  = {};
    allTxns.forEach((t) => {
      const k = t.rentRecord.toString();
      if (!txnMap[k]) txnMap[k] = [];
      txnMap[k].push(t);
    });
    const data = docs.map((d) => ({ ...d, transactions: txnMap[d._id.toString()] || [] }));

    res.json({ success: true, data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('getRecords:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rent-records/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecord = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id })
      .populate({ path: 'house', populate: { path: 'area', select: 'name city' } })
      .lean();
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    const transactions = await PaymentTransaction.find({ rentRecord: record._id })
      .sort({ paymentDate: 1 }).lean();
    res.json({ success: true, data: { ...record, transactions } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rent-records  — Generate slip (NO payment collected here)
// ─────────────────────────────────────────────────────────────────────────────
exports.createRecord = async (req, res) => {
  try {
    const { houseId, month, currReading, notes,
            overrides = {} } = req.body;

    const house = await House.findOne({ _id: houseId, owner: req.user._id });
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.status !== 'occupied') return res.status(400).json({ success: false, message: 'House is vacant' });

    const exists = await RentRecord.findOne({ house: houseId, month });
    if (exists) return res.status(400).json({ success: false, message: `Slip for ${month} already exists` });

    // ── Previous due: dynamically computed from last month's record ──────────
    const prevMonth = getPrevMonth(month);
    let prevDueAuto = 0;
    const prevRecord = await RentRecord.findOne({ house: houseId, month: prevMonth });
    if (prevRecord) {
      const prevTxns = await PaymentTransaction.find({ rentRecord: prevRecord._id }).lean();
      const prevPaid = prevTxns.reduce((s, t) => s + t.amount, 0);
      prevDueAuto    = Math.max(0, prevRecord.totalAmount - prevPaid);
    } else {
      prevDueAuto = house.prevDue || 0;
    }

    // ── Electricity ───────────────────────────────────────────────────────────
    const prevReading = house.prevReading || 0;
    const curr        = parseFloat(currReading) || 0;
    const units       = Math.max(0, curr - prevReading);
    const elecAuto    = parseFloat((units * house.elecPerUnit).toFixed(2));

    // ── Build override fields ─────────────────────────────────────────────────
    const roomRentField    = buildOverrideField(house.roomRent  || 0, overrides.roomRent);
    const waterBillField   = buildOverrideField(house.waterBill || 0, overrides.waterBill);
    const elecBillField    = buildOverrideField(elecAuto,             overrides.elecBill);
    const previousDueField = buildOverrideField(prevDueAuto,         overrides.previousDue);

    const totalAmount =
      roomRentField.final  +
      waterBillField.final +
      elecBillField.final  +
      previousDueField.final;

    const record = await RentRecord.create({
      house:       houseId,
      owner:       req.user._id,
      month,
      roomRent:    roomRentField,
      waterBill:   waterBillField,
      elecBill:    elecBillField,
      previousDue: previousDueField,
      prevReading,
      currReading: curr,
      units,
      perUnit:     house.elecPerUnit,
      totalAmount,
      status:      'unpaid',
      totalPaid:   0,
      notes:       notes || '',
    });

    // ── Roll meter forward on house ───────────────────────────────────────────
    await House.findByIdAndUpdate(houseId, { prevReading: curr, currReading: curr });

    const populated = await populatedRecord(record._id);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Slip already exists for this month' });
    console.error('createRecord:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/rent-records/:id  — Edit slip (with safe recalculation)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateRecord = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const { currReading, overrides = {}, notes } = req.body;

    // Recompute electricity if reading changed
    if (currReading !== undefined) {
      const curr      = parseFloat(currReading) || 0;
      const units     = Math.max(0, curr - record.prevReading);
      const elecAuto  = parseFloat((units * record.perUnit).toFixed(2));
      record.currReading = curr;
      record.units       = units;
      record.elecBill    = buildOverrideField(elecAuto, overrides.elecBill !== undefined ? overrides.elecBill : (record.elecBill.overridden ? record.elecBill.final : undefined));
    }

    // Apply other overrides
    if (overrides.roomRent    !== undefined) record.roomRent    = buildOverrideField(record.roomRent.auto,    overrides.roomRent);
    if (overrides.waterBill   !== undefined) record.waterBill   = buildOverrideField(record.waterBill.auto,   overrides.waterBill);
    if (overrides.elecBill    !== undefined && currReading === undefined)
      record.elecBill = buildOverrideField(record.elecBill.auto, overrides.elecBill);
    if (overrides.previousDue !== undefined) record.previousDue = buildOverrideField(record.previousDue.auto, overrides.previousDue);

    if (notes !== undefined) record.notes = notes;

    // Recompute total
    record.totalAmount =
      record.roomRent.final    +
      record.waterBill.final   +
      record.elecBill.final    +
      record.previousDue.final;

    // Resync status
    const txns      = await PaymentTransaction.find({ rentRecord: record._id }).lean();
    record.totalPaid = txns.reduce((s, t) => s + t.amount, 0);
    const remaining  = record.totalAmount - record.totalPaid;
    record.status    = remaining <= 0 ? 'paid' : record.totalPaid > 0 ? 'partial' : 'unpaid';

    await record.save();

    const populated = await populatedRecord(record._id);
    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('updateRecord:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/rent-records/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteRecord = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    await PaymentTransaction.deleteMany({ rentRecord: record._id });
    await record.deleteOne();
    res.json({ success: true, message: 'Rent record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rent-records/:id/payments  — Add a payment transaction
// ─────────────────────────────────────────────────────────────────────────────
exports.addPayment = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const { amount, paymentDate, paymentMethod = 'cash', note = '' } = req.body;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return res.status(400).json({ success: false, message: 'Invalid payment amount' });

    const txn = await PaymentTransaction.create({
      rentRecord:    record._id,
      house:         record.house,
      owner:         req.user._id,
      amount:        amt,
      paymentDate:   paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      note,
    });

    // Sync status on the rent record
    await syncRecordStatus(record._id);

    const populated = await populatedRecord(record._id);
    res.status(201).json({ success: true, data: populated, transaction: txn });
  } catch (err) {
    console.error('addPayment:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/rent-records/:id/payments/:txnId  — Remove a transaction
// ─────────────────────────────────────────────────────────────────────────────
exports.deletePayment = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const txn = await PaymentTransaction.findOne({ _id: req.params.txnId, rentRecord: record._id });
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });

    await txn.deleteOne();
    await syncRecordStatus(record._id);

    const populated = await populatedRecord(record._id);
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rent-records/dashboard
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [thisMonthRecords, allHouses] = await Promise.all([
      RentRecord.find({ owner: req.user._id, month })
        .populate({ path: 'house', select: 'tenantName number area' })
        .lean(),
      House.find({ owner: req.user._id }).lean(),
    ]);

    const collected  = thisMonthRecords.reduce((s, r) => s + (r.totalPaid || 0), 0);
    const pending    = thisMonthRecords.reduce((s, r) => s + Math.max(0, r.totalAmount - (r.totalPaid || 0)), 0);
    const occupied   = allHouses.filter((h) => h.status === 'occupied').length;
    const vacant     = allHouses.filter((h) => h.status === 'vacant').length;

    // Compute total outstanding (across ALL months, not just current)
    const allUnpaid = await RentRecord.find({ owner: req.user._id, status: { $in: ['unpaid', 'partial'] } }).lean();
    const totalDue  = allUnpaid.reduce((s, r) => s + Math.max(0, r.totalAmount - (r.totalPaid || 0)), 0);

    res.json({
      success: true,
      data: {
        month,
        collected,
        pending,
        totalDue,
        occupied,
        vacant,
        totalHouses:    allHouses.length,
        recentRecords:  thisMonthRecords.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('getDashboard:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function buildOverrideField(autoVal, overrideVal) {
  const a = parseFloat(autoVal) || 0;
  if (overrideVal !== undefined && overrideVal !== null && overrideVal !== '') {
    const f = parseFloat(overrideVal);
    if (!isNaN(f) && f !== a) {
      return { auto: a, final: f, overridden: true };
    }
  }
  return { auto: a, final: a, overridden: false };
}

function getPrevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}
