import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit3, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { fmtCurrency, fmtDate, monthLabel, statusColor } from '../utils/helpers';
import { EmptyState, PageLoader } from '../components/UI';
import SlipModal       from '../modals/SlipModal';
import AddPaymentModal from '../modals/AddPaymentModal';
import EditSlipModal   from '../modals/EditSlipModal';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const METHOD_ICONS = { cash: '💵', upi: '📱', bank_transfer: '🏦', cheque: '📄', other: '🔄' };

const History = () => {
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');
  const [expandedId,   setExpandedId]   = useState(null);

  const [slipRecord,   setSlipRecord]   = useState(null);
  const [payRecord,    setPayRecord]    = useState(null);
  const [editRecord,   setEditRecord]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filterStatus) params.status = filterStatus;
      if (filterMonth)  params.month  = filterMonth;
      const res = await rentRecordsAPI.getAll(params);
      setRecords(res.data.data);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus, filterMonth]);

  const deleteRecord = async (r) => {
    if (!window.confirm('Delete this slip and all payments?')) return;
    try {
      await rentRecordsAPI.remove(r._id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const deletePayment = async (record, txnId) => {
    if (!window.confirm('Remove this payment?')) return;
    try {
      await rentRecordsAPI.removePayment(record._id, txnId);
      toast.success('Payment removed');
      load();
    } catch { toast.error('Failed'); }
  };

  const displayed = records.filter((r) => {
    if (!search) return true;
    const h = r.house;
    return (
      h?.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      h?.number?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalCollected = displayed.reduce((s, r) => s + (r.totalPaid || 0), 0);
  const totalDue       = displayed.reduce((s, r) => s + Math.max(0, r.totalAmount - (r.totalPaid || 0)), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Payment History</h1>
          <p className="text-sm text-gray-400 mt-0.5">{displayed.length} records</p>
        </div>
      </div>

      {/* Summary */}
      {!loading && displayed.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Records',   value: displayed.length,     color: '' },
            { label: 'Total Collected', value: fmtCurrency(totalCollected), color: 'text-green-600' },
            { label: 'Total Remaining', value: fmtCurrency(totalDue),       color: 'text-red-600' },
            { label: 'Fully Paid',      value: displayed.filter((r) => r.status === 'paid').length, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`font-heading font-bold text-xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant or house…" className="flex-1 text-sm outline-none bg-transparent" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input w-auto min-w-[130px]">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="form-input w-auto min-w-[140px]">
          <option value="">All Months</option>
          {MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        {(filterStatus || filterMonth || search) && (
          <button className="btn btn-ghost btn-sm text-red-500"
            onClick={() => { setFilterStatus(''); setFilterMonth(''); setSearch(''); }}>
            Clear
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : displayed.length ? (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tenant', 'Month', 'Total', 'Paid', 'Remaining', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map((r) => {
                    const remaining = Math.max(0, r.totalAmount - (r.totalPaid || 0));
                    return (
                      <React.Fragment key={r._id}>
                        <tr className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setExpandedId(expandedId === r._id ? null : r._id)}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-sm">{r.house?.tenantName}</p>
                            <p className="text-xs text-gray-400">{r.house?.number} · {r.house?.area?.name}</p>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{monthLabel(r.month)}</td>
                          <td className="px-4 py-3 text-sm font-bold">{fmtCurrency(r.totalAmount)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">{fmtCurrency(r.totalPaid || 0)}</td>
                          <td className="px-4 py-3 text-sm font-semibold" style={{ color: remaining ? '#dc2626' : '#9ca3af' }}>
                            {remaining ? fmtCurrency(remaining) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${statusColor(r.status)}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button className="btn btn-ghost btn-sm text-blue-600 text-xs" onClick={(e) => { e.stopPropagation(); setSlipRecord(r); }}>🧾</button>
                              {r.status !== 'paid' && (
                                <button className="btn btn-primary btn-sm text-xs" onClick={(e) => { e.stopPropagation(); setPayRecord(r); }}>
                                  <Plus size={12} /> Pay
                                </button>
                              )}
                              <button className="btn btn-ghost btn-sm text-gray-400 text-xs" onClick={(e) => { e.stopPropagation(); setEditRecord(r); }}><Edit3 size={13}/></button>
                              <button className="btn btn-ghost btn-sm text-red-400 text-xs" onClick={(e) => { e.stopPropagation(); deleteRecord(r); }}><Trash2 size={13}/></button>
                            </div>
                          </td>
                        </tr>
                        {expandedId === r._id && r.transactions?.length > 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 pb-3 bg-gray-50">
                              <div className="flex gap-2 flex-wrap pt-2">
                                {r.transactions.map((txn) => (
                                  <div key={txn._id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs">
                                    <span>{METHOD_ICONS[txn.paymentMethod] || '💳'}</span>
                                    <span className="font-semibold text-green-600">{fmtCurrency(txn.amount)}</span>
                                    <span className="text-gray-400">{fmtDate(txn.paymentDate)}</span>
                                    {txn.note && <span className="text-gray-400">· {txn.note}</span>}
                                    <button onClick={() => deletePayment(r, txn._id)} className="text-red-400 ml-1">✕</button>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {displayed.map((r) => {
              const remaining = Math.max(0, r.totalAmount - (r.totalPaid || 0));
              return (
                <div key={r._id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{r.house?.tenantName}</p>
                      <p className="text-xs text-gray-400">{r.house?.number} · {monthLabel(r.month)}</p>
                    </div>
                    <span className={`badge ${statusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                    <div><p className="text-gray-400">Total</p><p className="font-bold">{fmtCurrency(r.totalAmount)}</p></div>
                    <div><p className="text-gray-400">Paid</p><p className="font-bold text-green-600">{fmtCurrency(r.totalPaid || 0)}</p></div>
                    <div><p className="text-gray-400">Due</p><p className="font-bold text-red-600">{remaining ? fmtCurrency(remaining) : '—'}</p></div>
                  </div>
                  {r.transactions?.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {r.transactions.map((txn) => (
                        <div key={txn._id} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5 text-xs">
                          <span>{METHOD_ICONS[txn.paymentMethod] || '💳'}</span>
                          <span className="font-semibold text-green-600">{fmtCurrency(txn.amount)}</span>
                          <span className="text-gray-400">{fmtDate(txn.paymentDate)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <button className="btn btn-ghost btn-sm text-blue-600 text-xs border border-gray-100 flex-1 justify-center" onClick={() => setSlipRecord(r)}>🧾 Slip</button>
                    {r.status !== 'paid' && (
                      <button className="btn btn-primary btn-sm text-xs flex-1 justify-center" onClick={() => setPayRecord(r)}>+ Add Payment</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card">
          <EmptyState icon="📋" title="No records" description={filterStatus || filterMonth || search ? 'Try adjusting filters' : 'Rent slips will appear here'} />
        </div>
      )}

      <SlipModal open={!!slipRecord} payment={slipRecord} house={slipRecord?.house} onClose={() => setSlipRecord(null)} />
      <AddPaymentModal open={!!payRecord} record={payRecord} onClose={() => setPayRecord(null)} onSave={load} />
      <EditSlipModal open={!!editRecord} record={editRecord} onClose={() => setEditRecord(null)} onSave={load} />
    </div>
  );
};

export default History;
