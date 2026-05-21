import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../services/api';
import { fmtCurrency, fmtDate, monthLabel, statusColor } from '../utils/helpers';
import { EmptyState, PageLoader } from '../components/UI';
import SlipModal from '../modals/SlipModal';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const History = () => {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');
  const [slipData, setSlipData] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filterStatus) params.status = filterStatus;
      if (filterMonth)  params.month  = filterMonth;
      const res = await paymentsAPI.getAll(params);
      setPayments(res.data.data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus, filterMonth]);

  const displayed = payments.filter((p) => {
    if (!search) return true;
    const h = p.house;
    return (
      h?.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      h?.number?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalCollected = displayed.reduce((s, p) => s + p.paid, 0);
  const totalDue       = displayed.reduce((s, p) => s + p.remaining, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Payment History</h1>
          <p className="text-sm text-gray-400 mt-0.5">{displayed.length} records</p>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && displayed.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Total Records</p>
            <p className="font-heading font-bold text-xl">{displayed.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Total Collected</p>
            <p className="font-heading font-bold text-xl text-green-600">{fmtCurrency(totalCollected)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Total Remaining</p>
            <p className="font-heading font-bold text-xl text-red-600">{fmtCurrency(totalDue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Fully Paid</p>
            <p className="font-heading font-bold text-xl text-blue-600">
              {displayed.filter((p) => p.status === 'paid').length}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant or house…"
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <select
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input w-auto min-w-[130px]"
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select
          value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="form-input w-auto min-w-[140px]"
        >
          <option value="">All Months</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
        {(filterStatus || filterMonth || search) && (
          <button
            className="btn btn-ghost btn-sm text-red-500"
            onClick={() => { setFilterStatus(''); setFilterMonth(''); setSearch(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : displayed.length ? (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tenant', 'Month', 'Total Bill', 'Paid', 'Remaining', 'Status', 'Date', 'Slip'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm">{p.house?.tenantName}</p>
                        <p className="text-xs text-gray-400">{p.house?.number} · {p.house?.area?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{monthLabel(p.month)}</td>
                      <td className="px-4 py-3 text-sm font-bold">{fmtCurrency(p.totalBill)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{fmtCurrency(p.paid)}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: p.remaining ? '#dc2626' : '#9ca3af' }}>
                        {p.remaining ? fmtCurrency(p.remaining) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statusColor(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(p.payDate)}</td>
                      <td className="px-4 py-3">
                        <button
                          className="btn btn-ghost btn-sm text-blue-600"
                          onClick={() => setSlipData(p)}
                        >
                          🧾 Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {displayed.map((p) => (
              <div key={p._id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{p.house?.tenantName}</p>
                    <p className="text-xs text-gray-400">{p.house?.number} · {monthLabel(p.month)}</p>
                  </div>
                  <span className={`badge ${statusColor(p.status)}`}>{p.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                  <div><p className="text-gray-400">Total</p><p className="font-bold">{fmtCurrency(p.totalBill)}</p></div>
                  <div><p className="text-gray-400">Paid</p><p className="font-bold text-green-600">{fmtCurrency(p.paid)}</p></div>
                  <div><p className="text-gray-400">Due</p><p className="font-bold text-red-600">{p.remaining ? fmtCurrency(p.remaining) : '—'}</p></div>
                </div>
                <button
                  className="btn btn-ghost btn-sm text-blue-600 mt-2 w-full justify-center border border-gray-100"
                  onClick={() => setSlipData(p)}
                >
                  🧾 View Slip
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon="📋" title="No payment records"
            description={filterStatus || filterMonth || search ? 'Try adjusting your filters' : 'Payment records will appear here once rent is calculated'}
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

export default History;
