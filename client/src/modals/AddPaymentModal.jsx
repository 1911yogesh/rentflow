import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';
import { fmtCurrency, monthLabel } from '../utils/helpers';

const METHOD_LABELS = {
  cash:          '💵 Cash',
  upi:           '📱 UPI',
  bank_transfer: '🏦 Bank Transfer',
  cheque:        '📄 Cheque',
  other:         '🔄 Other',
};

const AddPaymentModal = ({ open, onClose, onSave, record }) => {
  const [amount,  setAmount]  = useState('');
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [method,  setMethod]  = useState('cash');
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setMethod('cash');
    setNote('');
  };

  const remaining = record ? Math.max(0, record.totalAmount - (record.totalPaid || 0)) : 0;

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      const res = await rentRecordsAPI.addPayment(record._id, {
        amount: amt, paymentDate: date, paymentMethod: method, note,
      });
      toast.success(`✅ ₹${amt.toLocaleString('en-IN')} payment recorded`);
      reset();
      // Pass the updated record back so parent can update it in-list without a full reload
      onSave?.(res.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Add Payment"
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => { reset(); onClose(); }}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving…' : '✅ Save Payment'}
          </button>
        </>
      }
    >
      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Tenant</span>
          <span className="font-semibold">{record.house?.tenantName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Month</span>
          <span className="font-semibold">{monthLabel(record.month)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total Bill</span>
          <span className="font-bold">{fmtCurrency(record.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Already Paid</span>
          <span className="font-semibold text-green-600">{fmtCurrency(record.totalPaid || 0)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2">
          <span className="font-semibold">Remaining Due</span>
          <span className={`font-bold text-base ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {fmtCurrency(remaining)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <FormGroup label="Amount (₹) *">
          <input
            type="number" value={amount} min="1" max={remaining || undefined}
            onChange={(e) => setAmount(e.target.value)}
            className="form-input" placeholder={`Up to ${fmtCurrency(remaining)}`}
            autoFocus
          />
          {remaining > 0 && (
            <button type="button" onClick={() => setAmount(String(remaining))}
              className="text-xs text-blue-600 mt-1 hover:underline">
              Pay full remaining ({fmtCurrency(remaining)})
            </button>
          )}
        </FormGroup>

        <FormGroup label="Payment Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input" />
        </FormGroup>

        <FormGroup label="Payment Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="form-input">
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="form-input" placeholder="Reference, receipt number, etc." />
        </FormGroup>
      </div>
    </Modal>
  );
};

export default AddPaymentModal;
