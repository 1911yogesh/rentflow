import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { fmtCurrency, monthLabel, statusColor, initials } from '../utils/helpers';
import { EmptyState, PageLoader } from '../components/UI';
import SlipModal       from '../modals/SlipModal';
import AddPaymentModal from '../modals/AddPaymentModal';

const Slips = () => {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [slipData, setSlipData] = useState(null);
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

  const displayed = records.filter((r) => {
    if (!search) return true;
    return (
      r.house?.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      r.house?.number?.toLowerCase().includes(search.toLowerCase()) ||
      monthLabel(r.month).toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Rent Slips</h1>
          <p className="text-sm text-gray-400 mt-0.5">View and download rent receipts</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 mb-6 max-w-sm">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenant, house or month…" className="flex-1 text-sm outline-none bg-transparent" />
      </div>

      {loading ? <PageLoader /> : displayed.length ? (
        <div className="space-y-3">
          {displayed.map((r) => {
            const remaining = Math.max(0, r.totalAmount - (r.totalPaid || 0));
            return (
              <div key={r._id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {initials(r.house?.tenantName)}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSlipData(r)}>
                  <p className="font-semibold text-sm truncate">{r.house?.tenantName}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {r.house?.number} · {r.house?.area?.name} · {monthLabel(r.month)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{fmtCurrency(r.totalAmount)}</p>
                  {remaining > 0 && <p className="text-xs text-red-500">Due: {fmtCurrency(remaining)}</p>}
                  <span className={`badge ${statusColor(r.status)} text-[10px] mt-0.5`}>{r.status}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="btn btn-secondary btn-sm text-xs" onClick={() => setSlipData(r)}>🧾 View</button>
                  {r.status !== 'paid' && (
                    <button className="btn btn-primary btn-sm text-xs" onClick={() => setPayRecord(r)}>
                      <Plus size={12} /> Pay
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
            description={search ? `No results for "${search}"` : 'Rent slips appear here after generation'}
          />
        </div>
      )}

      <SlipModal open={!!slipData} payment={slipData} house={slipData?.house} onClose={() => setSlipData(null)} />
      <AddPaymentModal open={!!payRecord} record={payRecord} onClose={() => setPayRecord(null)} onSave={load} />
    </div>
  );
};

export default Slips;
