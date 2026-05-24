const RentRecord         = require('../models/RentRecord');
const PaymentTransaction = require('../models/PaymentTransaction');
const House              = require('../models/House');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildOverrideField(auto, override) {
  const autoVal = parseFloat(auto) || 0;
  if (override !== undefined && override !== null && override !== '') {
    const fin = parseFloat(override);
    return { auto: autoVal, final: isNaN(fin) ? autoVal : fin, overridden: true };
  }
  return { auto: autoVal, final: autoVal, overridden: false };
}

function getPrevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function genReceiptId(month, count) {
  const m = month.replace('-', '');
  const n = String(count).padStart(4, '0');
  return `RF-${m}-${n}`;
}

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

async function populatedRecord(recordId) {
  const record = await RentRecord.findById(recordId)
    .populate({ path: 'house', populate: { path: 'area', select: 'name city' } })
    .lean();
  if (!record) return null;
  const transactions = await PaymentTransaction.find({ rentRecord: recordId })
    .sort({ paymentDate: 1 }).lean();
  return { ...record, transactions };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rent-records
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecords = async (req, res) => {
  try {
    const { house, month, status, page = 1, limit = 50 } = req.query;
    const filter = { owner: req.user._id };
    if (house)  filter.house  = house;
    if (month)  filter.month  = month;
    if (status) filter.status = status;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await RentRecord.countDocuments(filter);
    const docs  = await RentRecord.find(filter)
      .sort({ month: -1, createdAt: -1 })
      .skip(skip).limit(parseInt(limit))
      .populate({ path: 'house', populate: { path: 'area', select: 'name city' } })
      .lean();

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
// POST /api/rent-records  — Generate slip
// ─────────────────────────────────────────────────────────────────────────────
exports.createRecord = async (req, res) => {
  try {
    const { houseId, month, currReading, notes, overrides = {} } = req.body;

    const house = await House.findOne({ _id: houseId, owner: req.user._id });
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.status !== 'occupied') return res.status(400).json({ success: false, message: 'House is vacant' });

    const exists = await RentRecord.findOne({ house: houseId, month });
    if (exists) return res.status(400).json({ success: false, message: `Slip for ${month} already exists` });

    // Previous due
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

    // ── Electricity: support both per_unit and fixed ───────────────────────
    const elecType    = house.elecType || 'per_unit';
    const prevReading = house.prevReading || 0;
    let elecAuto = 0, units = 0, curr = 0, perUnit = 0, elecFixed = 0;

    if (elecType === 'fixed') {
      elecAuto  = house.elecFixed || 0;
      elecFixed = house.elecFixed || 0;
    } else {
      curr      = parseFloat(currReading) || 0;
      if (curr < prevReading) {
        return res.status(400).json({
          success: false,
          message: `Current reading (${curr}) cannot be less than previous reading (${prevReading})`,
        });
      }
      units     = Math.max(0, curr - prevReading);
      perUnit   = house.elecPerUnit || 0;
      elecAuto  = parseFloat((units * perUnit).toFixed(2));
    }

    if (elecType === 'per_unit' && !currReading)
      return res.status(400).json({ success: false, message: 'Current meter reading is required' });

    // Build fields
    const roomRentField    = buildOverrideField(house.roomRent  || 0, overrides.roomRent);
    const waterBillField   = buildOverrideField(house.waterBill || 0, overrides.waterBill);
    const elecBillField    = buildOverrideField(elecAuto,             overrides.elecBill);
    const previousDueField = buildOverrideField(prevDueAuto,          overrides.previousDue);

    const totalAmount =
      roomRentField.final + waterBillField.final +
      elecBillField.final + previousDueField.final;

    const count = await RentRecord.countDocuments({ owner: req.user._id, month }) + 1;
    const receiptId = genReceiptId(month, count);

    const record = await RentRecord.create({
      house:       houseId,
      owner:       req.user._id,
      month,
      roomRent:    roomRentField,
      waterBill:   waterBillField,
      elecBill:    elecBillField,
      previousDue: previousDueField,
      elecType,
      prevReading,
      currReading: curr,
      units,
      perUnit,
      elecFixed,
      totalAmount,
      status:   'unpaid',
      totalPaid: 0,
      notes:     notes || '',
      receiptId,
    });

    // Roll meter forward (only for per_unit)
    if (elecType === 'per_unit') {
      await House.findByIdAndUpdate(houseId, { prevReading: curr, currReading: curr });
    }

    const populated = await populatedRecord(record._id);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Slip already exists for this month' });
    console.error('createRecord:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/rent-records/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.updateRecord = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const { currReading, overrides = {}, notes } = req.body;

    if (currReading !== undefined && record.elecType === 'per_unit') {
      const curr     = parseFloat(currReading) || 0;
      if (curr < record.prevReading) {
        return res.status(400).json({
          success: false,
          message: `Current reading (${curr}) cannot be less than previous reading (${record.prevReading})`,
        });
      }
      const units    = Math.max(0, curr - record.prevReading);
      const elecAuto = parseFloat((units * record.perUnit).toFixed(2));
      record.currReading = curr;
      record.units       = units;
      record.elecBill    = buildOverrideField(
        elecAuto,
        overrides.elecBill !== undefined ? overrides.elecBill
          : (record.elecBill.overridden ? record.elecBill.final : undefined)
      );
    }

    if (overrides.roomRent    !== undefined) record.roomRent    = buildOverrideField(record.roomRent.auto,    overrides.roomRent);
    if (overrides.waterBill   !== undefined) record.waterBill   = buildOverrideField(record.waterBill.auto,   overrides.waterBill);
    if (overrides.elecBill    !== undefined && currReading === undefined)
      record.elecBill = buildOverrideField(record.elecBill.auto, overrides.elecBill);
    if (overrides.previousDue !== undefined) record.previousDue = buildOverrideField(record.previousDue.auto, overrides.previousDue);
    if (notes !== undefined) record.notes = notes;

    record.totalAmount =
      record.roomRent.final + record.waterBill.final +
      record.elecBill.final + record.previousDue.final;

    const txns       = await PaymentTransaction.find({ rentRecord: record._id }).lean();
    record.totalPaid  = txns.reduce((s, t) => s + t.amount, 0);
    const remaining   = record.totalAmount - record.totalPaid;
    record.status     = remaining <= 0 ? 'paid' : record.totalPaid > 0 ? 'partial' : 'unpaid';

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
// Rolls back prevReading on the house if this was the latest slip
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteRecord = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // ── Meter reading rollback (per_unit mode only) ───────────────────────────
    // When a slip is deleted, restore house.prevReading to the value it had
    // BEFORE this slip was created (stored as record.prevReading).
    // Only roll back if no newer slip exists — we don't want to disturb the
    // reading chain if this isn't the most recent slip.
    if (record.elecType === 'per_unit' && record.prevReading != null) {
      const newerSlip = await RentRecord.findOne({
        house:  record.house,
        owner:  req.user._id,
        _id:    { $ne: record._id },
        month:  { $gt: record.month },
      });

      if (!newerSlip) {
        // Safe to roll back — this was the latest slip for this house
        await House.findByIdAndUpdate(record.house, {
          prevReading: record.prevReading,
          currReading: record.prevReading,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    await PaymentTransaction.deleteMany({ rentRecord: record._id });
    await record.deleteOne();
    res.json({ success: true, message: 'Rent record deleted' });
  } catch (err) {
    console.error('deleteRecord:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rent-records/:id/payments
// ─────────────────────────────────────────────────────────────────────────────
exports.addPayment = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const { amount, paymentDate, paymentMethod = 'cash', note = '' } = req.body;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    const remaining = Math.max(0, record.totalAmount - (record.totalPaid || 0));
    if (remaining <= 0) return res.status(400).json({ success: false, message: 'This rent slip is already fully paid' });
    if (amt > remaining) {
      return res.status(400).json({
        success: false,
        message: `Payment cannot exceed remaining due (${remaining})`,
      });
    }

    const txn = await PaymentTransaction.create({
      rentRecord:    record._id,
      house:         record.house,
      owner:         req.user._id,
      amount:        amt,
      paymentDate:   paymentDate || new Date(),
      paymentMethod,
      note,
    });

    await syncRecordStatus(record._id);
    const populated = await populatedRecord(record._id);
    res.status(201).json({ success: true, data: populated, transaction: txn });
  } catch (err) {
    console.error('addPayment:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/rent-records/:id/payments/:txnId
// ─────────────────────────────────────────────────────────────────────────────
exports.deletePayment = async (req, res) => {
  try {
    const record = await RentRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const txn = await PaymentTransaction.findOneAndDelete({
      _id: req.params.txnId, rentRecord: record._id, owner: req.user._id,
    });
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });

    await syncRecordStatus(record._id);
    const populated = await populatedRecord(record._id);
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rent-records/dashboard  — Stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const owner = req.user._id;
    const { month } = req.query;
    const currentMonth = month || new Date().toISOString().slice(0, 7);

    const [allRecords, monthRecords, allHouses] = await Promise.all([
      RentRecord.find({ owner }).lean(),
      RentRecord.find({ owner, month: currentMonth })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({ path: 'house', populate: { path: 'area', select: 'name city' } })
        .lean(),
      require('../models/House').find({ owner }).lean(),
    ]);

    const totalCollected = allRecords.reduce((s, r) => s + r.totalPaid, 0);
    const totalDue       = allRecords.reduce((s, r) => s + Math.max(0, r.totalAmount - r.totalPaid), 0);

    const currentMonthRecords = allRecords.filter((r) => r.month === currentMonth);
    const monthPaid    = currentMonthRecords.filter(r => r.status === 'paid').length;
    const monthPartial = currentMonthRecords.filter(r => r.status === 'partial').length;
    const monthUnpaid  = currentMonthRecords.filter(r => r.status === 'unpaid').length;
    const monthTotal   = currentMonthRecords.reduce((s, r) => s + r.totalAmount, 0);
    const monthCollected = currentMonthRecords.reduce((s, r) => s + r.totalPaid, 0);
    const occupied = allHouses.filter(h => h.status === 'occupied').length;
    const vacant = allHouses.filter(h => h.status === 'vacant').length;

    res.json({
      success: true,
      data: {
        collected: monthCollected,
        totalCollected,
        totalDue,
        occupied,
        occupiedHouses: occupied,
        vacant,
        vacantHouses: vacant,
        totalHouses: allHouses.length,
        recentRecords: monthRecords,
        month: {
          month: currentMonth,
          total: monthTotal,
          collected: monthCollected,
          due: monthTotal - monthCollected,
          paid: monthPaid,
          partial: monthPartial,
          unpaid: monthUnpaid,
          slips: currentMonthRecords.length,
        },
      },
    });
  } catch (err) {
    console.error('getDashboardStats:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
