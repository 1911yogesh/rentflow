import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { housesAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';

const HouseModal = ({ open, onClose, onSave, areaId }) => {
  const [form, setForm] = useState({
    number: '', roomRent: '', waterBill: '300', elecPerUnit: '11',
  });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const reset = () => setForm({ number: '', roomRent: '', waterBill: '300', elecPerUnit: '11' });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.number.trim()) return toast.error('House number is required');
    if (!form.roomRent)      return toast.error('Room rent is required');
    setLoading(true);
    try {
      await housesAPI.create({
        area:        areaId,
        number:      form.number.trim(),
        roomRent:    Number(form.roomRent),
        waterBill:   Number(form.waterBill) || 0,
        elecPerUnit: Number(form.elecPerUnit) || 11,
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
          <div className="col-span-2">
            <FormGroup label="Electricity Rate (₹ per unit)">
              <input name="elecPerUnit" value={form.elecPerUnit} onChange={handle}
                className="form-input" type="number" placeholder="11" min="0" step="0.5" />
            </FormGroup>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default HouseModal;
