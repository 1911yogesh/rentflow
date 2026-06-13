import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { housesAPI } from '../services/api';
import { Modal, FormGroup } from '../components/UI';

const TenantModal = ({ open, onClose, onSave, house }) => {
  const isEditing = !!(house?.tenantName);

  const [form, setForm] = useState({
    tenantName: '', phone: '', altPhone: '', aadhaar: '',
    address: '', joinDate: new Date().toISOString().split('T')[0],
    deposit: '', prevReading: '0',
    countryCode: '91', whatsappNumber: '',
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill form with existing tenant details when editing
  useEffect(() => {
    if (open && house) {
      setForm({
        tenantName:  house.tenantName  || '',
        phone:       house.phone       || '',
        altPhone:    house.altPhone    || '',
        aadhaar:     house.aadhaar     || '',
        address:     house.address     || '',
        joinDate:    house.joinDate
                       ? new Date(house.joinDate).toISOString().split('T')[0]
                       : new Date().toISOString().split('T')[0],
        deposit:     house.deposit     != null ? String(house.deposit)     : '',
        prevReading: house.prevReading != null ? String(house.prevReading) : '0',
        countryCode:    house.countryCode    || '91',
        whatsappNumber: house.whatsappNumber || '',
      });
    }
  }, [open, house?._id]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.tenantName.trim()) return toast.error('Tenant name is required');
    if (!form.phone.trim())      return toast.error('Phone number is required');
    if (form.countryCode && !/^\d{1,4}$/.test(form.countryCode.trim()))
      return toast.error('Country code must be 1-4 digits (no "+")');
    if (form.whatsappNumber && !/^\d{7,15}$/.test(form.whatsappNumber.replace(/\D/g, '')))
      return toast.error('WhatsApp number must be 7-15 digits');
    setLoading(true);
    try {
      await housesAPI.update(house._id, {
        tenantName:  form.tenantName.trim(),
        phone:       form.phone.trim(),
        altPhone:    form.altPhone.trim(),
        aadhaar:     form.aadhaar.trim(),
        address:     form.address.trim(),
        joinDate:    form.joinDate || undefined,
        deposit:     Number(form.deposit)     || 0,
        prevReading: Number(form.prevReading) || 0,
        countryCode:    form.countryCode.trim().replace(/\D/g, '') || '91',
        whatsappNumber: form.whatsappNumber.trim().replace(/\D/g, ''),
        // Only reset currReading to prevReading when adding a brand-new tenant
        ...(isEditing ? {} : { currReading: Number(form.prevReading) || 0 }),
        status: 'occupied',
      });
      toast.success(isEditing ? 'Tenant details updated' : 'Tenant added');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={isEditing ? `Edit Tenant — ${house?.number || ''}` : `Add Tenant — ${house?.number || ''}`}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving…' : isEditing ? 'Update Tenant' : 'Add Tenant'}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Basic Details</p>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="col-span-2 sm:col-span-1">
            <FormGroup label="Tenant Name *">
              <input name="tenantName" value={form.tenantName} onChange={handle}
                className="form-input" placeholder="Full name" autoFocus required />
            </FormGroup>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormGroup label="Phone Number *">
              <input name="phone" value={form.phone} onChange={handle}
                className="form-input" type="tel" placeholder="9876543210" required />
            </FormGroup>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormGroup label="Alternate Phone">
              <input name="altPhone" value={form.altPhone} onChange={handle}
                className="form-input" type="tel" placeholder="Optional" />
            </FormGroup>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormGroup label="Joining Date">
              <input name="joinDate" value={form.joinDate} onChange={handle}
                className="form-input" type="date" />
            </FormGroup>
          </div>
          <div className="col-span-2">
            <FormGroup label="Address">
              <input name="address" value={form.address} onChange={handle}
                className="form-input" placeholder="Tenant's permanent address (optional)" />
            </FormGroup>
          </div>
          <div className="col-span-2">
            <FormGroup label="Aadhaar / ID Number">
              <input name="aadhaar" value={form.aadhaar} onChange={handle}
                className="form-input" placeholder="Optional" />
            </FormGroup>
          </div>
        </div>

        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3 mt-2">WhatsApp Sharing</p>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="col-span-2 sm:col-span-1">
            <FormGroup label="Country Code">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">+</span>
                <input name="countryCode" value={form.countryCode} onChange={handle}
                  className="form-input" placeholder="91" inputMode="numeric" maxLength={4} />
              </div>
            </FormGroup>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormGroup label="WhatsApp Number">
              <input name="whatsappNumber" value={form.whatsappNumber} onChange={handle}
                className="form-input" type="tel" placeholder="Leave blank to use Phone Number above" />
            </FormGroup>
          </div>
          <p className="col-span-2 text-xs text-gray-400 -mt-1">
            Used for "Send via WhatsApp" on rent slips. If left blank, the Phone Number above is used.
          </p>
        </div>

        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3 mt-2">Financial Details</p>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Security Deposit (₹)">
            <input name="deposit" value={form.deposit} onChange={handle}
              className="form-input" type="number" placeholder="16000" min="0" />
          </FormGroup>
          <FormGroup label="Previous Meter Reading (units)">
            <input name="prevReading" value={form.prevReading} onChange={handle}
              className="form-input" type="number" placeholder="0" min="0" />
          </FormGroup>
        </div>
      </form>
    </Modal>
  );
};

export default TenantModal;
