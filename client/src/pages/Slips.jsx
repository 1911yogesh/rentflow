import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../services/api';
import { fmtCurrency, monthLabel, fmtDate, statusColor, initials } from '../utils/helpers';
import { EmptyState, PageLoader } from '../components/UI';
import SlipModal from '../modals/SlipModal';

const Slips = () => {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [slipData, setSlipData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await paymentsAPI.getAll({ limit: 100 });
        setPayments(res.data.data);
      } catch {
        toast.error('Failed to load slips');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayed = payments.filter((p) => {
    if (!search) return true;
    return (
      p.house?.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      p.house?.number?.toLowerCase().includes(search.toLowerCase()) ||
      monthLabel(p.month).toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Rent Slips</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Generate and download professional rent receipts
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 mb-6 max-w-sm">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenant, house or month…"
          className="flex-1 text-sm outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : displayed.length ? (
        <div className="space-y-3">
          {displayed.map((p) => (
            <div
              key={p._id}
              className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSlipData(p)}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                {initials(p.house?.tenantName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.house?.tenantName}</p>
                <p className="text-xs text-gray-400 truncate">
                  {p.house?.number} · {p.house?.area?.name} · {monthLabel(p.month)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">{fmtCurrency(p.totalBill)}</p>
                <span className={`badge ${statusColor(p.status)} text-[10px]`}>{p.status}</span>
              </div>
              <button className="btn btn-secondary btn-sm shrink-0">
                🧾 View Slip
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={search ? '🔍' : '🧾'}
            title={search ? 'No slips found' : 'No slips yet'}
            description={
              search
                ? `No results for "${search}"`
                : 'Rent slips appear here once you record payments'
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
    </div>
  );
};

export default Slips;
