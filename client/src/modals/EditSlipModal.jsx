import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';
import { fmtCurrency } from '../utils/helpers';

const EditSlipModal = ({ open, onClose, onSave, record }) => {
  const [currReading, setCurrReading] = useState('');
  const [notes,       setNotes]       = useState('');
  const [overrides,   setOverrides]   = useState({ roomRent: '', waterBill: '', elecBill: '', previousDue: '' });
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (open && record) {
      setCurrReading(record.currReading ?? '');
      setNotes(record.notes ?? '');
      setOverrides({
        roomRent:    record.roomRent?.overridden    ? record.roomRent.final    : '',
        waterBill:   record.waterBill?.overridden   ? record.waterBill.final   : '',
        elecBill:    record.elecBill?.overridden    ? record.elecBill.final    : '',
        previousDue: record.previousDue?.overridden ? record.previousDue.final : '',
      });
    }
  }, [open, record?._id]);

  if (!record) return null;

  const hasPayments = (record.transactions?.length || 0) > 0;

  const submit = async () => {
    setLoading(true);
    try {
      const body = { currReading: parseFloat(currReading), notes };
      const ovr  = {};
      if (overrides.roomRent    !== '') ovr.roomRent    = parseFloat(overrides.roomRent);
      if (overrides.waterBill   !== '') ovr.waterBill   = parseFloat(overrides.waterBill);
      if (overrides.elecBill    !== '') ovr.elecBill    = parseFloat(overrides.elecBill);
      if (overrides.previousDue !== '') ovr.previousDue = parseFloat(overrides.previousDue);
      if (Object.keys(ovr).length) body.overrides = ovr;

      const res = await rentRecordsAPI.update(record._id, body);
      toast.success('✅ Slip updated');
      // Pass updated record back so parent updates list in-place
      onSave?.(res.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update slip');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, auto }) => (
    <div>
      <label className="form-label flex items-center gap-1">
        {label}
        {overrides[field] !== '' && (
          <span className="text-[10px] text-amber-600 font-semibold">OVERRIDDEN</span>
        )}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="number" value={overrides[field]}
          onChange={(e) => setOverrides(o => ({ ...o, [field]: e.target.value }))}
          className="form-input" placeholder={`Auto: ${fmtCurrency(auto)}`}
        />
        {overrides[field] !== '' && (
          <button type="button" onClick={() => setOverrides(o => ({ ...o, [field]: '' }))}
            className="btn btn-ghost btn-sm text-red-500 shrink-0">Clear</button>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Auto-calculated: {fmtCurrency(auto)}</p>
    </div>
  );

  return (
    <Modal
      open={open} onClose={onClose}
      title="Edit Rent Slip"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving…' : '💾 Save Changes'}
          </button>
        </>
      }
    >
      {hasPayments && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-sm text-amber-700">
          ⚠️ This slip has <strong>{record.transactions.length}</strong> payment(s) recorded.
          Editing will recalculate the total. Status will be updated automatically.
        </div>
      )}

      <div className="space-y-4">
        <FormGroup label="Current Meter Reading">
          <input type="number" value={currReading} onChange={(e) => setCurrReading(e.target.value)}
            className="form-input" />
          <p className="text-[11px] text-gray-400 mt-1">Previous reading: {record.prevReading}</p>
        </FormGroup>

        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Override Values</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Room Rent"   field="roomRent"    auto={record.roomRent?.auto    ?? record.roomRent} />
            <Field label="Water Bill"  field="waterBill"   auto={record.waterBill?.auto   ?? record.waterBill} />
            <Field label="Electricity" field="elecBill"    auto={record.elecBill?.auto    ?? record.elecBill} />
            <Field label="Prev Due"    field="previousDue" auto={record.previousDue?.auto ?? record.previousDue} />
          </div>
        </div>

        <FormGroup label="Notes">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" />
        </FormGroup>
      </div>
    </Modal>
  );
};

export default EditSlipModal;
