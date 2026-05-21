import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { areasAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';

const AreaModal = ({ open, onClose, onSave, area = null }) => {
  const isEdit = !!area;
  const [form, setForm]     = useState({ name: '', city: 'Ahmedabad' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (area) setForm({ name: area.name, city: area.city });
    else      setForm({ name: '', city: 'Ahmedabad' });
  }, [area, open]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Area name is required');
    setLoading(true);
    try {
      if (isEdit) await areasAPI.update(area._id, form);
      else        await areasAPI.create(form);
      toast.success(isEdit ? 'Area updated' : 'Area added');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save area');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Area' : 'Add New Area'}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Add Area'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-1">
        <FormGroup label="Area Name *">
          <input
            name="name" value={form.name} onChange={handle}
            className="form-input" placeholder="e.g. Satellite" autoFocus required
          />
        </FormGroup>
        <FormGroup label="City">
          <input
            name="city" value={form.city} onChange={handle}
            className="form-input" placeholder="e.g. Ahmedabad"
          />
        </FormGroup>
      </form>
    </Modal>
  );
};

export default AreaModal;
