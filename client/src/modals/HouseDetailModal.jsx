import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { housesAPI, rentRecordsAPI } from '../services/api';
import { Modal, EmptyState, PageLoader } from '../components/UI';
import { fmtCurrency, fmtDate, monthLabel, statusColor, initials } from '../utils/helpers';
import TenantModal              from './TenantModal';
import RentSlipGenerateModal    from './RentSlipGenerateModal';
import AddPaymentModal          from './AddPaymentModal';
import EditSlipModal            from './EditSlipModal';
import SlipModal                from './SlipModal';

const METHOD_ICONS = { cash: '💵', upi: '📱', bank_transfer: '🏦', cheque: '📄', other: '🔄' };

const HouseDetailModal = ({ open, onClose, onSave, house: initialHouse }) => {
  const [tab,        setTab]        = useState('info');
  const [house,      setHouse]      = useState(initialHouse);
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [vacating,   setVacating]   = useState(false);

  // Sub-modals
  const [tenantModal,    setTenantModal]    = useState(false);
  const [generateModal,  setGenerateModal]  = useState(false);
  const [payModal,       setPayModal]       = useState(null);   // record to pay
  const [editModal,      setEditModal]      = useState(null);   // record to edit
  const [slipRecord,     setSlipRecord]     = useState(null);   // record to view slip

  useEffect(() => {
    if (!open || !initialHouse) return;
    setHouse(initialHouse);
    setTab('info');
    loadRecords(initialHouse._id);
  }, [open, initialHouse?._id]);

  const loadRecords = async (houseId) => {
    setLoading(true);
    try {
      const res = await rentRecordsAPI.getAll({ house: houseId, limit: 24 });
      setRecords(res.data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const refresh = async () => {
    try {
      const res = await housesAPI.getOne(house._id);
      setHouse(res.data.data);
      loadRecords(house._id);
      onSave();
    } catch { /* ignore */ }
  };

  const vacate = async () => {
    if (!window.confirm(`Mark ${house.number} as vacant? Tenant data will be cleared.`)) return;
    setVacating(true);
    try {
      await housesAPI.vacate(house._id);
      toast.success('House marked as vacant');
      onSave();
      onClose();
    } catch { toast.error('Failed to vacate'); }
    finally { setVacating(false); }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm('Delete this rent slip and all its payments? This cannot be undone.')) return;
    try {
      await rentRecordsAPI.remove(record._id);
      toast.success('Slip deleted');
      refresh();
    } catch { toast.error('Failed to delete slip'); }
  };

  const deletePayment = async (record, txnId) => {
    if (!window.confirm('Remove this payment?')) return;
    try {
      await rentRecordsAPI.removePayment(record._id, txnId);
      toast.success('Payment removed');
      refresh();
    } catch { toast.error('Failed to remove payment'); }
  };

  if (!house) return null;
  const isOccupied = house.status === 'occupied';

  return (
    <>
      <Modal open={open} onClose={onClose} title="" size="lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 -mt-1">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
            {isOccupied ? initials(house.tenantName) : '🏠'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-semibold text-lg">
              {isOccupied ? house.tenantName : `${house.number} — Vacant`}
            </h2>
            <p className="text-xs text-gray-400">{house.number}</p>
          </div>
          <span className={`badge ${isOccupied ? 'badge-green' : 'badge-gray'} shrink-0`}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {[
            { key: 'info',    label: 'Info' },
            ...(isOccupied ? [{ key: 'rent', label: 'Rent' }] : []),
            { key: 'history', label: `History (${records.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── INFO TAB ──────────────────────────────────────────────────────── */}
        {tab === 'info' && (
          isOccupied ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <InfoCard title="Tenant Details">
                  <InfoRow label="Phone"    value={`📞 ${house.phone}`} />
                  {house.altPhone && <InfoRow label="Alt"    value={house.altPhone} />}
                  <InfoRow label="Joined"   value={fmtDate(house.joinDate)} />
                  <InfoRow label="Deposit"  value={fmtCurrency(house.deposit)} />
                  {house.aadhaar && <InfoRow label="Aadhaar" value={house.aadhaar} />}
                </InfoCard>
                <InfoCard title="Rent Config">
                  <InfoRow label="Room Rent"  value={fmtCurrency(house.roomRent)} />
                  <InfoRow label="Water Bill" value={fmtCurrency(house.waterBill)} />
                  {house.elecType === 'fixed' ? (<InfoRow label="Electricity" value={`₹${house.elecFixed} (Fixed)`} />) : (<InfoRow label="Per Unit" value={`₹${house.elecPerUnit}`} />)}
                  <InfoRow label="Prev Meter" value={`${house.prevReading} units`} />
                </InfoCard>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-primary" onClick={() => setTab('rent')}>
                  🧾 Generate Slip
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setTenantModal(true)}>
                  ✏️ Edit Tenant
                </button>
                <button className="btn btn-danger btn-sm" onClick={vacate} disabled={vacating}>
                  {vacating ? 'Vacating…' : 'Mark Vacant'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="🏠" title="House is Vacant"
              description="Add a tenant to start managing rent"
              action={<button className="btn btn-primary" onClick={() => setTenantModal(true)}>Add Tenant</button>}
            />
          )
        )}

        {/* ── RENT TAB ──────────────────────────────────────────────────────── */}
        {tab === 'rent' && isOccupied && (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🧾</p>
            <p className="font-semibold text-gray-700 mb-1">Generate Monthly Rent Slip</p>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              The slip records the bill. Collect payment separately using the "Add Payment" button.
            </p>
            <button className="btn btn-primary" onClick={() => setGenerateModal(true)}>
              Generate Slip
            </button>
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────────── */}
        {tab === 'history' && (
          loading ? <PageLoader /> : records.length ? (
            <div className="space-y-3">
              {records.map((r) => <RecordCard
                key={r._id} record={r}
                onAddPayment={() => setPayModal(r)}
                onViewSlip={() => setSlipRecord(r)}
                onEdit={() => setEditModal(r)}
                onDelete={() => deleteRecord(r)}
                onDeletePayment={(txnId) => deletePayment(r, txnId)}
              />)}
            </div>
          ) : (
            <EmptyState icon="📋" title="No History" description="Generate a slip first" />
          )
        )}
      </Modal>

      {/* Sub-modals */}
      <TenantModal
        open={tenantModal} house={house}
        onClose={() => setTenantModal(false)} onSave={refresh}
      />
      <RentSlipGenerateModal
        open={generateModal} house={house}
        onClose={() => setGenerateModal(false)} onSave={refresh}
      />
      <AddPaymentModal
        open={!!payModal} record={payModal}
        onClose={() => setPayModal(null)} onSave={refresh}
      />
      <EditSlipModal
        open={!!editModal} record={editModal}
        onClose={() => setEditModal(null)} onSave={refresh}
      />
      <SlipModal
        open={!!slipRecord} payment={slipRecord} house={house}
        onClose={() => setSlipRecord(null)}
      />
    </>
  );
};

// ── Record Card ────────────────────────────────────────────────────────────────
const RecordCard = ({ record: r, onAddPayment, onViewSlip, onEdit, onDelete, onDeletePayment }) => {
  const [expanded, setExpanded] = useState(false);
  const remaining = Math.max(0, r.totalAmount - (r.totalPaid || 0));

  const STATUS_COLORS = {
    paid:    'bg-green-50 border-green-200',
    partial: 'bg-amber-50 border-amber-200',
    unpaid:  'bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-xl border p-3 ${STATUS_COLORS[r.status] || 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{monthLabel(r.month)}</p>
            <span className={`badge ${statusColor(r.status)} text-[10px]`}>{r.status}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Total: {fmtCurrency(r.totalAmount)} · Paid: {fmtCurrency(r.totalPaid || 0)}
            {remaining > 0 && <span className="text-red-600 font-semibold"> · Due: {fmtCurrency(remaining)}</span>}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {r.status !== 'paid' && (
            <button onClick={onAddPayment} className="btn btn-primary btn-sm text-[11px] px-2">+ Pay</button>
          )}
          <button onClick={onViewSlip} className="btn btn-ghost btn-sm text-[11px]">🧾</button>
          <button onClick={() => setExpanded((v) => !v)} className="btn btn-ghost btn-sm text-[11px]">
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {/* Bill breakdown */}
          <div className="bg-white rounded-lg p-3 text-xs space-y-1">
            <BillLine label="Room Rent"   val={r.roomRent}    />
            <BillLine label="Water Bill"  val={r.waterBill}   />
            <BillLine label="Electricity" val={r.elecBill} sub={r.elecType === 'fixed' ? 'Fixed amount' : `${r.units} × ₹${r.perUnit}`} />
            {(r.previousDue?.final > 0 || r.previousDue > 0) && <BillLine label="Prev Due" val={r.previousDue} red />}
          </div>

          {/* Payment transactions */}
          {r.transactions?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Payments</p>
              {r.transactions.map((txn) => (
                <div key={txn._id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs">
                  <span>{METHOD_ICONS[txn.paymentMethod] || '💳'}</span>
                  <div className="flex-1">
                    <span className="font-semibold text-green-600">{fmtCurrency(txn.amount)}</span>
                    <span className="text-gray-400 ml-2">{fmtDate(txn.paymentDate)}</span>
                    {txn.note && <span className="text-gray-400 ml-1">· {txn.note}</span>}
                  </div>
                  <button onClick={() => onDeletePayment(txn._id)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onEdit} className="btn btn-ghost btn-sm text-xs text-blue-600">✏️ Edit Slip</button>
            <button onClick={onDelete} className="btn btn-ghost btn-sm text-xs text-red-600">🗑️ Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};

const BillLine = ({ label, val, sub, red }) => {
  const final = typeof val === 'object' ? (val?.final ?? 0) : (val ?? 0);
  const isOverridden = typeof val === 'object' && val?.overridden;
  return (
    <div className="flex justify-between text-xs">
      <span className={`text-gray-500 ${red ? 'text-red-500' : ''}`}>{label}{sub && <span className="text-gray-400 ml-1">({sub})</span>}</span>
      <span className={`font-semibold ${red ? 'text-red-600' : ''} ${isOverridden ? 'text-amber-600' : ''}`}>
        {fmtCurrency(final)}{isOverridden ? ' *' : ''}
      </span>
    </div>
  );
};

const InfoCard = ({ title, children }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{title}</p>
    <div className="space-y-2">{children}</div>
  </div>
);
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-400">{label}</span>
    <span className="font-semibold text-gray-800 text-right max-w-[60%] truncate">{value || '—'}</span>
  </div>
);

export default HouseDetailModal;
