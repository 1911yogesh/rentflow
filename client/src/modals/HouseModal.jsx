import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { housesAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';

const DEFAULT_FORM = {
  number: '', roomRent: '', waterBill: '300',
  elecType: 'per_unit', elecPerUnit: '11', elecFixed: '',
};

const HouseModal = ({ open, onClose, onSave, areaId }) => {
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const reset  = () => setForm(DEFAULT_FORM);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.number.trim()) return toast.error('House number is required');
    if (!form.roomRent)      return toast.error('Room rent is required');
    if (form.elecType === 'per_unit' && !form.elecPerUnit)
      return toast.error('Per unit rate is required');
    if (form.elecType === 'fixed' && !form.elecFixed)
      return toast.error('Fixed electricity amount is required');

    setLoading(true);
    try {
      await housesAPI.create({
        area:        areaId,
        number:      form.number.trim(),
        roomRent:    Number(form.roomRent),
        waterBill:   Number(form.waterBill) || 0,
        elecType:    form.elecType,
        elecPerUnit: Number(form.elecPerUnit) || 11,
        elecFixed:   Number(form.elecFixed)   || 0,
      });
      toast.success('House added');
      reset();
      onSave();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add house');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title="Add New House" size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Adding…' : 'Add House'}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FormGroup label="House / Room Number *">
              <input name="number" value={form.number} onChange={handle}
                className="form-input" placeholder="e.g. A-101" autoFocus required />
            </FormGroup>
          </div>
          <FormGroup label="Monthly Room Rent (₹) *">
            <input name="roomRent" value={form.roomRent} onChange={handle}
              className="form-input" type="number" placeholder="8000" min="0" required />
          </FormGroup>
          <FormGroup label="Water Bill (₹)">
            <input name="waterBill" value={form.waterBill} onChange={handle}
              className="form-input" type="number" placeholder="300" min="0" />
          </FormGroup>

          {/* Electricity Config */}
          <div className="col-span-2">
            <FormGroup label="Electricity Calculation Type">
              <div className="grid grid-cols-2 gap-2">
                {[['per_unit','⚡ Per Unit'], ['fixed','📌 Fixed Amount']].map(([val, lbl]) => (
                  <label key={val}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${form.elecType === val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <input type="radio" name="elecType" value={val} checked={form.elecType === val}
                      onChange={handle} className="text-blue-600" />
                    <span className="text-sm font-medium">{lbl}</span>
                  </label>
                ))}
              </div>
            </FormGroup>
          </div>

          {form.elecType === 'per_unit' ? (
            <div className="col-span-2">
              <FormGroup label="Rate per Unit (₹)">
                <input name="elecPerUnit" value={form.elecPerUnit} onChange={handle}
                  className="form-input" type="number" placeholder="11" min="0" step="0.5" />
              </FormGroup>
            </div>
          ) : (
            <div className="col-span-2">
              <FormGroup label="Fixed Electricity Amount (₹/month)">
                <input name="elecFixed" value={form.elecFixed} onChange={handle}
                  className="form-input" type="number" placeholder="500" min="0" required />
              </FormGroup>
              <p className="text-xs text-gray-400 mt-1">This fixed amount will be added to every bill automatically.</p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default HouseModal;
