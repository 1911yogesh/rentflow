import React, { useState, useEffect } from 'react';
import { Plus, Receipt, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { fmtCurrency, monthLabel, statusColor, initials } from '../utils/helpers';
import { EmptyState, PageLoader } from '../components/UI';
import SlipModal       from '../modals/SlipModal';
import AddPaymentModal from '../modals/AddPaymentModal';

const Slips = () => {
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [slipData,  setSlipData]  = useState(null);
  const [payRecord, setPayRecord] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await rentRecordsAPI.getAll({ limit: 100 });
      setRecords(res.data.data);
    } catch { toast.error('Failed to load slips'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleWhatsApp = async (r) => {
    setSendingId(r._id);
    await sendSlipViaWhatsApp(r, r.house);
    setSendingId(null);
  };

  const displayed = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.house?.tenantName?.toLowerCase().includes(q) ||
      r.house?.number?.toLowerCase().includes(q) ||
      monthLabel(r.month).toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Rent Slips"
        subtitle="View and download rent receipts"
      />

      <div className="mb-5 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tenant, house or month…"
        />
      </div>

      {loading ? <PageLoader /> : displayed.length ? (
        <div className="space-y-2.5">
          {displayed.map((r) => {
            const remaining = Math.max(0, r.totalAmount - (r.totalPaid || 0));
            return (
              <div
                key={r._id}
                className="card p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSlipData(r)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {initials(r.house?.tenantName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{r.house?.tenantName}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {r.house?.number} · {r.house?.area?.name} · {monthLabel(r.month)}
                  </p>
                </div>

                {/* Amounts + status */}
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="font-bold text-sm text-gray-900">{fmtCurrency(r.totalAmount)}</p>
                  {remaining > 0 && (
                    <p className="text-xs text-red-500 mt-0.5">Due: {fmtCurrency(remaining)}</p>
                  )}
                </div>

                <div className="shrink-0">
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="btn btn-secondary btn-sm text-xs" onClick={() => setSlipData(r)}>🧾 View</button>
                  {r.status !== 'paid' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setPayRecord(r)}
                    >
                      <Plus size={12} />
                      <span className="hidden sm:inline">Pay</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={search ? '🔍' : '🧾'}
            title={search ? 'No slips found' : 'No slips yet'}
            description={
              search
                ? `No results for "${search}"`
                : 'Rent slips appear here after they are generated from a house'
            }
          />
        </div>
      )}

      <SlipModal
        open={!!slipData}
        payment={slipData}
        house={slipData?.house}
        onClose={() => setSlipData(null)}
      />
      <AddPaymentModal
        open={!!payRecord}
        record={payRecord}
        onClose={() => setPayRecord(null)}
        onSave={load}
      />
    </div>
  );
};

export default Slips;
