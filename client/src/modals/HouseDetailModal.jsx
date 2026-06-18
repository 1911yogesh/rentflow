import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Pencil, UserMinus, Receipt, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { housesAPI, rentRecordsAPI } from '../services/api';
import { Modal, EmptyState, PageLoader, StatusBadge, ConfirmDialog } from '../components/UI';
import { fmtCurrency, fmtDate, monthLabel, initials } from '../utils/helpers';
import TenantModal           from './TenantModal';
import RentSlipGenerateModal from './RentSlipGenerateModal';
import AddPaymentModal       from './AddPaymentModal';
import EditSlipModal         from './EditSlipModal';
import SlipModal             from './SlipModal';

const METHOD_LABELS = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', other: 'Other' };

const HouseDetailModal = ({ open, onClose, onSave, house: initialHouse }) => {
  const [tab,      setTab]      = useState('info');
  const [house,    setHouse]    = useState(initialHouse);
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [vacating, setVacating] = useState(false);

  const [tenantModal,   setTenantModal]   = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [payModal,      setPayModal]      = useState(null);
  const [editModal,     setEditModal]     = useState(null);
  const [slipRecord,    setSlipRecord]    = useState(null);
  const [confirmVacate, setConfirmVacate] = useState(false);
  const [confirmDelRec, setConfirmDelRec] = useState(null);
  const [confirmDelPay, setConfirmDelPay] = useState(null); // { record, txnId }

  const loadHouse = useCallback(async (id) => {
    try { const r = await housesAPI.getOne(id); setHouse(r.data.data); return r.data.data; } catch {}
  }, []);

  const loadRecords = useCallback(async (id) => {
    setLoading(true);
    try { const r = await rentRecordsAPI.getAll({ house: id, limit: 24 }); setRecords(r.data.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!open || !initialHouse) return;
    setTab('info');
    loadHouse(initialHouse._id);
    loadRecords(initialHouse._id);
  }, [open, initialHouse?._id]);

  const refresh = useCallback(async () => {
    const id = (house || initialHouse)?._id;
    if (!id) return;
    const fresh = await loadHouse(id);
    await loadRecords(id);
    onSave?.();
    return fresh;
  }, [house, initialHouse, loadHouse, loadRecords, onSave]);

  const updateRecordInList = useCallback((updated) => {
    setRecords(p => p.map(r => r._id === updated._id ? updated : r));
    loadHouse((house || initialHouse)?._id);
    onSave?.();
  }, [house, initialHouse, loadHouse, onSave]);

  const vacate = async () => {
    setVacating(true);
    try {
      await housesAPI.vacate(house._id);
      toast.success('House marked as vacant');
      onSave?.();
      onClose();
    } catch { toast.error('Failed to vacate'); }
    finally { setVacating(false); }
  };

  const deleteRecord = async (record) => {
    try {
      await rentRecordsAPI.remove(record._id);
      toast.success('Slip deleted');
      setRecords(p => p.filter(r => r._id !== record._id));
      loadHouse(house._id);
      onSave?.();
    } catch { toast.error('Failed to delete slip'); }
  };

  const deletePayment = async ({ record, txnId }) => {
    try {
      const res = await rentRecordsAPI.removePayment(record._id, txnId);
      toast.success('Payment removed');
      updateRecordInList(res.data.data);
    } catch { toast.error('Failed to remove payment'); }
  };

  if (!house) return null;
  const isOccupied = house.status === 'occupied';

  return (
    <>
      <Modal open={open} onClose={onClose} title="" size="lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 -mt-1">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 font-heading">
            {isOccupied ? initials(house.tenantName) : '🏠'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-lg leading-tight">
              {isOccupied ? house.tenantName : `${house.number} — Vacant`}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{house.number}</p>
          </div>
          <span className={`badge shrink-0 ${isOccupied ? 'badge-green' : 'badge-gray'}`}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {[
            { key: 'info',    label: 'Info' },
            ...(isOccupied ? [{ key: 'rent', label: 'Generate Slip' }] : []),
            { key: 'history', label: `History (${records.length})` },
          ].map(({ key, label }) => (
            <button
              key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* INFO TAB */}
        {tab === 'info' && (
          isOccupied ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <InfoCard title="Tenant Details">
                  <InfoRow label="Phone"   value={house.phone} />
                  {house.altPhone && <InfoRow label="Alt Phone" value={house.altPhone} />}
                  <InfoRow label="Joined"  value={fmtDate(house.joinDate)} />
                  <InfoRow label="Deposit" value={fmtCurrency(house.deposit)} />
                  {house.aadhaar && <InfoRow label="Aadhaar" value={house.aadhaar} />}
                </InfoCard>

                <InfoCard title="Rent Configuration">
                  <InfoRow label="Room Rent"  value={fmtCurrency(house.roomRent)} />
                  <InfoRow label="Water Bill" value={fmtCurrency(house.waterBill)} />
                  {house.elecType === 'fixed'
                    ? <InfoRow label="Electricity" value={`${fmtCurrency(house.elecFixed)} (fixed)`} />
                    : <InfoRow label="Per Unit"    value={`₹${house.elecPerUnit}`} />
                  }
                  <InfoRow label="Prev Meter" value={`${house.prevReading} units`} />
                </InfoCard>
              </div>

              {house.prevDue > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-red-700">Outstanding Due</p>
                  <p className="font-bold text-red-700">{fmtCurrency(house.prevDue)}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-primary" onClick={() => setTab('rent')}>
                  <Receipt size={15} /> Generate Slip
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setTenantModal(true)}>
                  <Pencil size={13} /> Edit Tenant
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmVacate(true)}
                  disabled={vacating}
                >
                  <UserMinus size={13} /> {vacating ? 'Vacating…' : 'Mark Vacant'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="🏠" title="House is Vacant"
              description="Add a tenant to start managing rent"
              action={
                <button className="btn btn-primary" onClick={() => setTenantModal(true)}>
                  Add Tenant
                </button>
              }
            />
          )
        )}

        {/* RENT TAB */}
        {tab === 'rent' && isOccupied && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Receipt size={26} />
            </div>
            <p className="font-heading font-bold text-gray-800 mb-1">Generate Monthly Rent Slip</p>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              The slip records the bill. You can collect payment separately using the "Add Payment" button.
            </p>
            <button className="btn btn-primary" onClick={() => setGenerateModal(true)}>
              Generate Slip
            </button>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          loading ? <PageLoader /> : records.length ? (
            <div className="space-y-3">
              {records.map((r) => (
                <RecordCard
                  key={r._id}
                  record={r}
                  onAddPayment={() => setPayModal(r)}
                  onViewSlip={()   => setSlipRecord(r)}
                  onEdit={()       => setEditModal(r)}
                  onDelete={()     => setConfirmDelRec(r)}
                  onDeletePayment={(txnId) => setConfirmDelPay({ record: r, txnId })}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon="📋" title="No History" description="Generate a slip first to track payments" />
          )
        )}
      </Modal>

      {/* Sub-modals */}
      <TenantModal
        open={tenantModal} house={house}
        onClose={() => setTenantModal(false)}
        onSave={async () => { await refresh(); setTenantModal(false); }}
      />
      <RentSlipGenerateModal
        open={generateModal} house={house}
        onClose={() => setGenerateModal(false)}
        onSave={async () => { await refresh(); setTab('history'); }}
      />
      <AddPaymentModal
        open={!!payModal} record={payModal}
        onClose={() => setPayModal(null)}
        onSave={(updated) => { if (updated) updateRecordInList(updated); else refresh(); setPayModal(null); }}
      />
      <EditSlipModal
        open={!!editModal} record={editModal}
        onClose={() => setEditModal(null)}
        onSave={(updated) => { if (updated) updateRecordInList(updated); else refresh(); setEditModal(null); }}
      />
      <SlipModal
        open={!!slipRecord} payment={slipRecord} house={house}
        onClose={() => setSlipRecord(null)}
      />

      <ConfirmDialog
        open={confirmVacate}
        onClose={() => setConfirmVacate(false)}
        onConfirm={vacate}
        title={`Mark "${house.number}" as Vacant?`}
        message="Tenant data will be cleared and the house will be listed as available. Rent history is preserved."
      />
      <ConfirmDialog
        open={!!confirmDelRec}
        onClose={() => setConfirmDelRec(null)}
        onConfirm={() => deleteRecord(confirmDelRec)}
        title="Delete Rent Slip?"
        message="This slip and all its payments will be permanently deleted. The meter reading rollback will also apply."
      />
      <ConfirmDialog
        open={!!confirmDelPay}
        onClose={() => setConfirmDelPay(null)}
        onConfirm={() => deletePayment(confirmDelPay)}
        title="Remove Payment?"
        message="This payment entry will be permanently removed from the record."
      />
    </>
  );
};

/* ── Record Card ────────────────────────────────────────────────────────────── */
const RecordCard = ({ record: r, onAddPayment, onViewSlip, onEdit, onDelete, onDeletePayment }) => {
  const [expanded, setExpanded] = useState(false);
  const remaining = Math.max(0, r.totalAmount - (r.totalPaid || 0));

  const borderCls = { paid: 'border-emerald-200', partial: 'border-amber-200', unpaid: 'border-red-200' }[r.status] || 'border-gray-200';
  const bgCls     = { paid: 'bg-emerald-50/50',   partial: 'bg-amber-50/50',   unpaid: 'bg-red-50/50'   }[r.status] || 'bg-gray-50';

  return (
    <div className={`rounded-xl border p-3.5 ${borderCls} ${bgCls}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{monthLabel(r.month)}</p>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {fmtCurrency(r.totalAmount)} total
            {r.totalPaid > 0 && <> · <span className="text-emerald-600 font-medium">{fmtCurrency(r.totalPaid)} paid</span></>}
            {remaining > 0 && <> · <span className="text-red-600 font-semibold">{fmtCurrency(remaining)} due</span></>}
          </p>
        </div>
        <div className="flex gap-1.5 items-center shrink-0">
          {r.status !== 'paid' && (
            <button onClick={onAddPayment} className="btn btn-primary btn-xs">
              <Plus size={11} /> Pay
            </button>
          )}
          <button onClick={onViewSlip} className="btn btn-secondary btn-xs" title="View slip">
            <Receipt size={12} />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="btn btn-ghost btn-xs text-gray-400"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2.5">
          {/* Bill breakdown */}
          <div className="bg-white rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
            <BillLine label="Room Rent"   val={r.roomRent} />
            <BillLine label="Water Bill"  val={r.waterBill} />
            <BillLine label="Electricity" val={r.elecBill}
              sub={r.elecType === 'fixed' ? 'Fixed' : `${r.units} units × ₹${r.perUnit}`} />
            {(r.previousDue?.final > 0 || r.prevDue > 0) && (
              <BillLine label="Prev Due" val={r.previousDue ?? r.prevDue} red />
            )}
          </div>

          {/* Transactions */}
          {r.transactions?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payments</p>
              {r.transactions.map((txn) => (
                <div key={txn._id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-xs border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-emerald-600">{fmtCurrency(txn.amount)}</span>
                    <span className="text-gray-400 ml-2">{METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}</span>
                    <span className="text-gray-300 ml-1">·</span>
                    <span className="text-gray-400 ml-1">{fmtDate(txn.paymentDate)}</span>
                    {txn.note && <span className="text-gray-400 ml-1">· {txn.note}</span>}
                  </div>
                  <button
                    onClick={() => onDeletePayment(txn._id)}
                    className="text-gray-300 hover:text-red-500 transition p-1 rounded"
                    aria-label="Remove payment"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onEdit} className="btn btn-ghost btn-xs text-indigo-600">
              <Pencil size={11} /> Edit Slip
            </button>
            <button onClick={onDelete} className="btn btn-ghost btn-xs text-red-500">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const BillLine = ({ label, val, sub, red }) => {
  const final = typeof val === 'object' ? (val?.final ?? 0) : (val ?? 0);
  return (
    <div className="flex justify-between text-xs">
      <span className={`text-gray-500 ${red ? 'text-red-500' : ''}`}>
        {label}{sub && <span className="text-gray-400 ml-1">({sub})</span>}
      </span>
      <span className={`font-semibold ${red ? 'text-red-600' : 'text-gray-800'}`}>
        {fmtCurrency(final)}
      </span>
    </div>
  );
};

const InfoCard = ({ title, children }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>
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
