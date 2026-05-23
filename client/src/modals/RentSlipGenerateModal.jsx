import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';
import { fmtCurrency, currentMonth, calcUnits, calcElec } from '../utils/helpers';

const RentSlipGenerateModal = ({ open, onClose, onSave, house }) => {
  const [month,       setMonth]      = useState(currentMonth());
  const [currReading, setCurrReading]= useState('');
  const [notes,       setNotes]      = useState('');
  const [loading,     setLoading]    = useState(false);

  // Override state
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrides, setOverrides] = useState({ roomRent: '', waterBill: '', elecBill: '', previousDue: '' });

  useEffect(() => {
    if (open) {
      setMonth(currentMonth());
      setCurrReading('');
      setNotes('');
      setOverrideMode(false);
      setOverrides({ roomRent: '', waterBill: '', elecBill: '', previousDue: '' });
    }
  }, [open, house?._id]);

  if (!house) return null;

  const curr      = parseFloat(currReading) || 0;
  const units     = calcUnits(curr, house.prevReading);
  const elecAuto  = calcElec(units, house.elecPerUnit);
  const prevDue   = house.prevDue || 0;
  const hasReading = curr > 0 && curr >= house.prevReading;

  // Effective values (override takes precedence if set)
  const eff = {
    roomRent:   overrides.roomRent    !== '' ? parseFloat(overrides.roomRent)    : (house.roomRent  || 0),
    waterBill:  overrides.waterBill   !== '' ? parseFloat(overrides.waterBill)   : (house.waterBill || 0),
    elecBill:   overrides.elecBill    !== '' ? parseFloat(overrides.elecBill)    : (hasReading ? elecAuto : 0),
    previousDue:overrides.previousDue !== '' ? parseFloat(overrides.previousDue) : prevDue,
  };
  const totalBill = eff.roomRent + eff.waterBill + eff.elecBill + eff.previousDue;

  const submit = async () => {
    if (!currReading) return toast.error('Please enter current meter reading');
    if (curr < house.prevReading)
      return toast.error(`Reading (${curr}) cannot be less than previous (${house.prevReading})`);

    setLoading(true);
    try {
      const body = {
        houseId: house._id,
        month,
        currReading: curr,
        notes,
      };
      // only send overrides that are actually set
      const ovr = {};
      if (overrides.roomRent    !== '') ovr.roomRent    = parseFloat(overrides.roomRent);
      if (overrides.waterBill   !== '') ovr.waterBill   = parseFloat(overrides.waterBill);
      if (overrides.elecBill    !== '') ovr.elecBill    = parseFloat(overrides.elecBill);
      if (overrides.previousDue !== '') ovr.previousDue = parseFloat(overrides.previousDue);
      if (Object.keys(ovr).length) body.overrides = ovr;

      await rentRecordsAPI.create(body);
      toast.success('✅ Rent slip generated!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate slip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={`Generate Rent Slip — ${house.number}`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading || !hasReading}>
            {loading ? 'Generating…' : '🧾 Generate Slip'}
          </button>
        </>
      }
    >
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-blue-700">🧾 Slip Generation — Separate from Payment</p>
        <p className="text-xs text-blue-500 mt-0.5">
          Generate the slip first. Add payments later via "Add Payment" button.
        </p>
      </div>

      {/* Month */}
      <FormGroup label="Month *" className="mb-4">
        <input
          type="month" value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="form-input"
        />
      </FormGroup>

      {/* Meter reading */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FormGroup label="Previous Reading">
          <input value={house.prevReading} readOnly className="form-input bg-gray-50 text-gray-500 cursor-not-allowed" />
        </FormGroup>
        <FormGroup label="Current Reading *">
          <input
            type="number" value={currReading} min={house.prevReading}
            onChange={(e) => setCurrReading(e.target.value)}
            className="form-input" placeholder="Enter reading" autoFocus
          />
        </FormGroup>
      </div>

      {/* Bill breakdown */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
        <BillRow
          label="🏠 Room Rent"
          auto={house.roomRent}
          override={overrides.roomRent}
          overrideMode={overrideMode}
          onOverride={(v) => setOverrides((o) => ({ ...o, roomRent: v }))}
        />
        <BillRow
          label="💧 Water Bill"
          auto={house.waterBill}
          override={overrides.waterBill}
          overrideMode={overrideMode}
          onOverride={(v) => setOverrides((o) => ({ ...o, waterBill: v }))}
        />
        <BillRow
          label="⚡ Electricity"
          auto={hasReading ? elecAuto : null}
          sub={hasReading ? `${units} units × ₹${house.elecPerUnit}` : 'Enter reading above'}
          override={overrides.elecBill}
          overrideMode={overrideMode}
          onOverride={(v) => setOverrides((o) => ({ ...o, elecBill: v }))}
        />
        {prevDue > 0 && (
          <BillRow
            label="⚠️ Previous Due"
            auto={prevDue}
            override={overrides.previousDue}
            overrideMode={overrideMode}
            onOverride={(v) => setOverrides((o) => ({ ...o, previousDue: v }))}
            valueClass="text-red-600"
          />
        )}
        <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
          <span className="font-heading font-bold text-gray-900">Total Payable</span>
          <span className="font-heading font-bold text-lg text-blue-700">
            {hasReading ? fmtCurrency(totalBill) : '—'}
          </span>
        </div>
      </div>

      {/* Override toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setOverrideMode((v) => !v)}
          className={`btn btn-sm ${overrideMode ? 'btn-primary' : 'btn-secondary'}`}
        >
          {overrideMode ? '✏️ Override Mode ON' : '✏️ Manual Override'}
        </button>
        {overrideMode && (
          <span className="text-xs text-amber-600">Enter custom values to override auto-calculated amounts</span>
        )}
      </div>

      {/* Notes */}
      <FormGroup label="Notes (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          className="form-input" placeholder="Any notes for this slip" />
      </FormGroup>
    </Modal>
  );
};

const BillRow = ({ label, auto, sub, override, overrideMode, onOverride, valueClass = '' }) => {
  const isOverridden = override !== '' && override !== undefined;
  const displayVal = isOverridden ? parseFloat(override) : auto;

  return (
    <div className="flex justify-between items-start py-1 text-sm">
      <div className="flex-1">
        <span className="text-gray-600">{label}</span>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        {isOverridden && (
          <p className="text-[10px] text-amber-600 mt-0.5">
            Auto: {auto !== null ? fmtCurrency(auto) : '—'} → Overridden
          </p>
        )}
      </div>
      {overrideMode ? (
        <input
          type="number" value={override} onChange={(e) => onOverride(e.target.value)}
          placeholder={auto !== null ? String(auto) : '0'}
          className="w-24 text-right text-sm border border-amber-300 rounded px-2 py-1 bg-amber-50"
        />
      ) : (
        <span className={`font-semibold text-gray-800 ${valueClass} ${isOverridden ? 'text-amber-600' : ''}`}>
          {displayVal !== null && displayVal !== undefined ? fmtCurrency(displayVal) : '—'}
        </span>
      )}
    </div>
  );
};

export default RentSlipGenerateModal;
