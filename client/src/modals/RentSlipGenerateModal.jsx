import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';
import { fmtCurrency, currentMonth, calcUnits, calcElec } from '../utils/helpers';

const RentSlipGenerateModal = ({ open, onClose, onSave, house }) => {
  const [month, setMonth] = useState(currentMonth());
  const [currReading, setCurrReading] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [overrideMode, setOverrideMode] = useState(false);
  const [overrides, setOverrides] = useState({
    roomRent: '',
    waterBill: '',
    elecBill: '',
    previousDue: '',
  });

  const isFixed = house?.elecType === 'fixed';
  const elecLabel = isFixed ? 'Fixed Electricity' : 'Electricity (Per Unit)';

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

  let elecAuto = 0;
  let units = 0;
  if (isFixed) {
    elecAuto = house.elecFixed || 0;
  } else {
    const curr = parseFloat(currReading) || 0;
    units = calcUnits(curr, house.prevReading);
    elecAuto = calcElec(units, house.elecPerUnit);
  }

  const prevDue = house.prevDue || 0;
  const curr = parseFloat(currReading) || 0;
  const hasReading = !isFixed && curr > 0 && curr >= house.prevReading;

  const eff = {
    roomRent: overrides.roomRent !== '' ? parseFloat(overrides.roomRent) : (house.roomRent || 0),
    waterBill: overrides.waterBill !== '' ? parseFloat(overrides.waterBill) : (house.waterBill || 0),
    elecBill: overrides.elecBill !== '' ? parseFloat(overrides.elecBill) : (isFixed ? elecAuto : (hasReading ? elecAuto : 0)),
    previousDue: overrides.previousDue !== '' ? parseFloat(overrides.previousDue) : prevDue,
  };
  const totalBill = eff.roomRent + eff.waterBill + eff.elecBill + eff.previousDue;

  const submit = async () => {
    if (!isFixed) {
      if (!currReading) return toast.error('Please enter current meter reading');
      if (curr < house.prevReading) {
        return toast.error(`Reading (${curr}) cannot be less than previous (${house.prevReading})`);
      }
    }

    setLoading(true);
    try {
      const body = { houseId: house._id, month, notes };
      if (!isFixed) body.currReading = curr;

      const ovr = {};
      if (overrides.roomRent !== '') ovr.roomRent = parseFloat(overrides.roomRent);
      if (overrides.waterBill !== '') ovr.waterBill = parseFloat(overrides.waterBill);
      if (overrides.elecBill !== '') ovr.elecBill = parseFloat(overrides.elecBill);
      if (overrides.previousDue !== '') ovr.previousDue = parseFloat(overrides.previousDue);
      if (Object.keys(ovr).length) body.overrides = ovr;

      const { data } = await rentRecordsAPI.create(body);
      toast.success('Rent slip generated!');
      onSave?.(data.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate slip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Generate Rent Slip - ${house.number}`}
      size="md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end w-full sm:w-auto">
          <button className="btn btn-secondary btn-sm justify-center" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm justify-center" onClick={submit} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Slip'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{house.tenantName}</p>
              <p className="text-gray-600 mt-0.5">{house.number}</p>
            </div>
            {!isFixed && (
              <div className="text-right shrink-0">
                <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Prev. Reading</p>
                <p className="font-bold text-blue-900">{house.prevReading} units</p>
              </div>
            )}
          </div>
          {isFixed && (
            <span className="inline-block mt-3 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
              Fixed Electricity: {fmtCurrency(house.elecFixed)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Billing Month">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input" />
          </FormGroup>

          {!isFixed ? (
            <FormGroup label="Current Meter Reading">
              <input
                type="number"
                value={currReading}
                onChange={(e) => setCurrReading(e.target.value)}
                placeholder="Enter current reading"
                className="input"
                min={house.prevReading}
              />
              {currReading && curr >= house.prevReading && (
                <p className="text-xs text-blue-700 mt-1.5 font-semibold">
                  {units} units x Rs {house.elecPerUnit} = {fmtCurrency(elecAuto)}
                </p>
              )}
              {currReading && curr < house.prevReading && (
                <p className="text-xs text-red-600 mt-1.5 font-semibold">
                  Reading cannot be lower than {house.prevReading}
                </p>
              )}
            </FormGroup>
          ) : (
            <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm">
              <p className="text-purple-800 font-semibold">Fixed Electricity</p>
              <p className="text-purple-700 mt-0.5">{fmtCurrency(house.elecFixed)}/month</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 text-sm shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bill Preview</p>
          <BillRow label="Room Rent" val={eff.roomRent} />
          <BillRow label="Water Bill" val={eff.waterBill} />
          <BillRow label={elecLabel} val={eff.elecBill} />
          {prevDue > 0 && <BillRow label="Previous Due" val={eff.previousDue} red />}
          <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between font-bold text-blue-700">
            <span>Total</span>
            <span>{fmtCurrency(totalBill)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOverrideMode((m) => !m)}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
        >
          {overrideMode ? 'Hide overrides' : 'Override amounts'}
        </button>

        {overrideMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50 border border-amber-100 p-4 rounded-xl">
            {[
              ['roomRent', 'Room Rent'],
              ['waterBill', 'Water Bill'],
              ['elecBill', elecLabel],
              ['previousDue', 'Prev. Due'],
            ].map(([k, lbl]) => (
              <FormGroup key={k} label={lbl}>
                <input
                  type="number"
                  value={overrides[k]}
                  placeholder={`Auto: ${fmtCurrency(k === 'roomRent' ? house.roomRent : k === 'waterBill' ? house.waterBill : k === 'elecBill' ? elecAuto : prevDue)}`}
                  onChange={(e) => setOverrides((p) => ({ ...p, [k]: e.target.value }))}
                  className="input text-xs"
                />
              </FormGroup>
            ))}
          </div>
        )}

        <FormGroup label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="Any note for this slip..."
          />
        </FormGroup>
      </div>
    </Modal>
  );
};

const BillRow = ({ label, val, red }) => (
  <div className={`flex justify-between gap-3 ${red ? 'text-red-600' : 'text-gray-700'}`}>
    <span>{label}</span>
    <span className="font-medium text-right">{val > 0 ? fmtCurrency(val) : '-'}</span>
  </div>
);

export default RentSlipGenerateModal;
