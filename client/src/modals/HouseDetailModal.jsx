import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { housesAPI, paymentsAPI } from '../services/api';
import { Modal, Tabs, EmptyState, PageLoader } from '../components/UI';
import {
  fmtCurrency, fmtDate, monthLabel, statusColor, initials,
} from '../utils/helpers';
import TenantModal   from './TenantModal';
import RentCalcModal from './RentCalcModal';
import SlipModal     from './SlipModal';

const HouseDetailModal = ({ open, onClose, onSave, house: initialHouse }) => {
  const [tab,        setTab]        = useState('info');
  const [house,      setHouse]      = useState(initialHouse);
  const [payments,   setPayments]   = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const [tenantModal, setTenantModal] = useState(false);
  const [rentModal,   setRentModal]   = useState(false);
  const [slipPayment, setSlipPayment] = useState(null);
  const [vacating,    setVacating]    = useState(false);

  // Refresh house & payments when opened
  useEffect(() => {
    if (!open || !initialHouse) return;
    setHouse(initialHouse);
    setTab('info');
    loadPayments(initialHouse._id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialHouse?._id]);

  const loadPayments = async (houseId) => {
    setLoadingPay(true);
    try {
      const res = await paymentsAPI.getAll({ house: houseId, limit: 24 });
      setPayments(res.data.data);
    } catch {
      /* ignore */
    } finally {
      setLoadingPay(false);
    }
  };

  const refreshHouse = async () => {
    try {
      const res = await housesAPI.getOne(house._id);
      setHouse(res.data.data);
      loadPayments(house._id);
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
    } catch {
      toast.error('Failed to vacate house');
    } finally {
      setVacating(false);
    }
  };

  if (!house) return null;

  const isOccupied = house.status === 'occupied';

  return (
    <>
      <Modal
        open={open} onClose={onClose}
        title=""
        size="lg"
      >
        {/* Custom header inside body */}
        <div className="flex items-center gap-3 mb-5 -mt-1">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
            {isOccupied ? initials(house.tenantName) : '🏠'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-semibold text-lg leading-tight">
              {isOccupied ? house.tenantName : `${house.number} — Vacant`}
            </h2>
            <p className="text-xs text-gray-400">{house.number}</p>
          </div>
          <span className={`badge ${isOccupied ? 'badge-green' : 'badge-gray'} shrink-0`}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>

        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'info', label: 'Info' },
            ...(isOccupied ? [{ key: 'rent', label: 'Rent Calc' }] : []),
            { key: 'history', label: 'History' },
          ]}
        />

        {/* ── INFO TAB ────────────────────────────────────────────────── */}
        {tab === 'info' && (
          isOccupied ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <InfoCard title="Tenant Details">
                  <InfoRow label="Phone"    value={`📞 ${house.phone}`} />
                  {house.altPhone && <InfoRow label="Alt Phone" value={house.altPhone} />}
                  <InfoRow label="Joined"   value={fmtDate(house.joinDate)} />
                  <InfoRow label="Deposit"  value={fmtCurrency(house.deposit)} />
                  {house.address && <InfoRow label="Address"  value={house.address} />}
                </InfoCard>
                <InfoCard title="Rent Configuration">
                  <InfoRow label="Room Rent"    value={fmtCurrency(house.roomRent)} />
                  <InfoRow label="Water Bill"   value={fmtCurrency(house.waterBill)} />
                  <InfoRow label="Per Unit"     value={`₹${house.elecPerUnit}`} />
                  <InfoRow label="Prev Reading" value={`${house.prevReading} units`} />
                </InfoCard>
              </div>

              {house.prevDue > 0 && (
                <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <div>
                    <p className="font-semibold text-red-700 text-sm">⚠️ Previous Due</p>
                    <p className="text-xs text-gray-400 mt-0.5">Carry-forward amount</p>
                  </div>
                  <p className="font-heading font-bold text-xl text-red-600">{fmtCurrency(house.prevDue)}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-primary" onClick={() => setTab('rent')}>
                  🧮 Calculate Rent
                </button>
                <button className="btn btn-danger btn-sm" onClick={vacate} disabled={vacating}>
                  {vacating ? 'Vacating…' : 'Mark Vacant'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="🏠" title="House is Vacant"
              description="Add a tenant to start managing rent for this house"
              action={
                <button className="btn btn-primary" onClick={() => setTenantModal(true)}>
                  Add Tenant
                </button>
              }
            />
          )
        )}

        {/* ── RENT CALC TAB ───────────────────────────────────────────── */}
        {tab === 'rent' && isOccupied && (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🧮</p>
            <p className="font-semibold text-gray-700 mb-1">Ready to Calculate Rent</p>
            <p className="text-sm text-gray-400 mb-6">
              Click below to open the rent calculator for {house.tenantName}
            </p>
            <button className="btn btn-primary" onClick={() => setRentModal(true)}>
              Open Rent Calculator
            </button>
          </div>
        )}

        {/* ── HISTORY TAB ─────────────────────────────────────────────── */}
        {tab === 'history' && (
          loadingPay ? <PageLoader /> : payments.length ? (
            <div className="divide-y divide-gray-50">
              {payments.map((p) => (
                <div key={p._id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{monthLabel(p.month)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.prevReading} → {p.currReading} ({p.units} units) · {fmtDate(p.payDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{fmtCurrency(p.totalBill)}</p>
                    <span className={`badge ${statusColor(p.status)} text-[10px]`}>{p.status}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm text-blue-600 shrink-0"
                    onClick={() => setSlipPayment(p)}
                  >
                    🧾
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📋" title="No History Yet"
              description="Payment records will appear here after the first rent calculation"
            />
          )
        )}
      </Modal>

      {/* Sub-modals */}
      <TenantModal
        open={tenantModal} house={house}
        onClose={() => setTenantModal(false)}
        onSave={refreshHouse}
      />

      <RentCalcModal
        open={rentModal} house={house}
        onClose={() => setRentModal(false)}
        onSave={refreshHouse}
      />

      <SlipModal
        open={!!slipPayment}
        payment={slipPayment}
        house={house}
        onClose={() => setSlipPayment(null)}
      />
    </>
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
