import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';
import { fmtCurrency, currentMonth, calcUnits, calcElec } from '../utils/helpers';

const RentCalcModal = ({ open, onClose, onSave, house }) => {
  const [currReading, setCurrReading] = useState('');
  const [paid,        setPaid]        = useState('');
  const [payDate,     setPayDate]     = useState(new Date().toISOString().split('T')[0]);
  const [notes,       setNotes]       = useState('');
  const [loading,     setLoading]     = useState(false);

  // Reset when house changes
  useEffect(() => {
    setCurrReading('');
    setPaid('');
    setPayDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  }, [house?._id, open]);

  if (!house) return null;

  // ── Live calculations ────────────────────────────────────────────────────────
  const curr      = parseFloat(currReading) || 0;
  const paidAmt   = parseFloat(paid) || 0;
  const units     = calcUnits(curr, house.prevReading);
  const elecBill  = calcElec(units, house.elecPerUnit);
  const roomRent  = house.roomRent  || 0;
  const waterBill = house.waterBill || 0;
  const prevDue   = house.prevDue   || 0;
  const totalBill = roomRent + waterBill + elecBill + prevDue;
  const remaining = curr ? Math.max(0, totalBill - paidAmt) : null;
  const hasReading = curr > 0 && curr >= house.prevReading;

  const submit = async () => {
    if (!currReading) return toast.error('Please enter current meter reading');
    if (curr < house.prevReading)
      return toast.error(`Current reading (${curr}) cannot be less than previous (${house.prevReading})`);
    if (!paid || paidAmt <= 0) return toast.error('Please enter amount paid');

    setLoading(true);
    try {
      await paymentsAPI.create({
        houseId:     house._id,
        month:       currentMonth(),
        currReading: curr,
        paid:        paidAmt,
        payDate,
        notes,
      });
      toast.success(remaining === 0 ? '✅ Fully paid!' : `⚠️ Partial — Due: ${fmtCurrency(remaining)}`);
      onSave();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={`Rent Calculation — ${house.number}`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving…' : 'Save Payment'}
          </button>
        </>
      }
    >
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-blue-700">⚡ Live Electricity Calculation</p>
        <p className="text-xs text-blue-500 mt-0.5">
          Enter current meter reading — bill calculates automatically
        </p>
      </div>

      {/* Meter reading inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FormGroup label="Previous Reading (units)">
          <input value={house.prevReading} readOnly
            className="form-input bg-gray-50 text-gray-500 cursor-not-allowed" />
        </FormGroup>
        <FormGroup label="Current Reading (units) *">
          <input
            type="number" value={currReading} min={house.prevReading}
            onChange={(e) => setCurrReading(e.target.value)}
            className="form-input" placeholder="Enter reading" autoFocus
          />
        </FormGroup>
      </div>

      {/* Bill breakdown */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
        <BillRow label="🏠 Room Rent" value={fmtCurrency(roomRent)} />
        <BillRow label="💧 Water Bill" value={fmtCurrency(waterBill)} />
        <BillRow
          label="⚡ Electricity Bill"
          value={hasReading ? fmtCurrency(elecBill) : '—'}
          sub={hasReading ? `${units} units × ₹${house.elecPerUnit}` : 'Enter reading above'}
        />
        {prevDue > 0 && (
          <BillRow label="⚠️ Previous Due" value={fmtCurrency(prevDue)} valueClass="text-red-600 font-semibold" />
        )}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-heading font-bold text-gray-900">Total Payable</span>
            <span className="font-heading font-bold text-lg text-gray-900">
              {hasReading ? fmtCurrency(totalBill) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <FormGroup label="Amount Paid (₹) *">
          <input type="number" value={paid} min="0"
            onChange={(e) => setPaid(e.target.value)}
            className="form-input" placeholder="0" />
        </FormGroup>
        <FormGroup label="Payment Date">
          <input type="date" value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            className="form-input" />
        </FormGroup>
      </div>

      <FormGroup label="Notes (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          className="form-input" placeholder="Any notes about this payment" />
      </FormGroup>

      {/* Remaining indicator */}
      {hasReading && paidAmt > 0 && remaining !== null && (
        <div className={`rounded-lg px-4 py-3 text-sm font-semibold flex justify-between items-center ${
          remaining === 0
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <span>{remaining === 0 ? '✅ Fully paid' : '⚠️ Remaining due (carry forward)'}</span>
          {remaining > 0 && <span className="text-red-600 font-bold">{fmtCurrency(remaining)}</span>}
        </div>
      )}
    </Modal>
  );
};

const BillRow = ({ label, value, sub, valueClass = 'font-semibold text-gray-800' }) => (
  <div className="flex justify-between items-start py-1 text-sm">
    <div>
      <span className="text-gray-600">{label}</span>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
    <span className={valueClass}>{value}</span>
  </div>
);

export default RentCalcModal;
