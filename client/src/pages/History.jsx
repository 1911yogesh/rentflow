import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, Plus, Receipt, MessageCircle } from 'lucide-react';
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

const METHOD_LABELS = {
  cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank', cheque: 'Cheque', other: 'Other',
};

const History = () => {
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');
  const [expandedId,   setExpandedId]   = useState(null);
  const [sendingId,    setSendingId]    = useState(null);

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
    try {
      await rentRecordsAPI.remove(r._id);
      toast.success('Slip deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const deletePayment = async ({ record, txnId }) => {
    try {
      await rentRecordsAPI.removePayment(record._id, txnId);
      toast.success('Payment removed');
      load();
    } catch { toast.error('Failed to remove payment'); }
  };

  const handleWhatsApp = async (r) => {
    setSendingId(r._id);
    await sendSlipViaWhatsApp(r, r.house);
    setSendingId(null);
  };

  const displayed = records.filter((r) => {
    if (!search) return true;
    const h = r.house;
    const q = search.toLowerCase();
    return (
      h?.tenantName?.toLowerCase().includes(q) ||
      h?.number?.toLowerCase().includes(q)
    );
  });

  const totalCollected = displayed.reduce((s, r) => s + (r.totalPaid || 0), 0);
  const totalDue       = displayed.reduce((s, r) => s + Math.max(0, r.totalAmount - (r.totalPaid || 0)), 0);

  return (
    <div>
      <PageHeader
        title="Payment History"
        subtitle={`${displayed.length} record${displayed.length !== 1 ? 's' : ''}`}
      />

      {/* Summary stats */}
      {!loading && displayed.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Records',   value: displayed.length,                  color: 'text-gray-900' },
            { label: 'Total Collected', value: fmtCurrency(totalCollected),        color: 'text-emerald-600' },
            { label: 'Total Remaining', value: fmtCurrency(totalDue),             color: 'text-red-600' },
            { label: 'Fully Paid',      value: displayed.filter(r => r.status === 'paid').length, color: 'text-indigo-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`font-heading font-bold text-xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2.5 mb-5 flex-wrap items-center">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tenant or house…" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input w-auto min-w-[130px]">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="form-input w-auto min-w-[140px]">
          <option value="">All Months</option>
          {MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        {(filterStatus || filterMonth || search) && (
          <button
            className="text-xs font-semibold text-red-500 hover:text-red-700 px-2"
            onClick={() => { setFilterStatus(''); setFilterMonth(''); setSearch(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : displayed.length ? (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Tenant / House', 'Month', 'Total', 'Paid', 'Remaining', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map((r) => {
                    const remaining = Math.max(0, r.totalAmount - (r.totalPaid || 0));
                    const isExpanded = expandedId === r._id;
                    return (
                      <React.Fragment key={r._id}>
                        <tr
                          className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : r._id)}
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-sm text-gray-900">{r.house?.tenantName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{r.house?.number} · {r.house?.area?.name}</p>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium text-gray-700">{monthLabel(r.month)}</td>
                          <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{fmtCurrency(r.totalAmount)}</td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-emerald-600">{fmtCurrency(r.totalPaid || 0)}</td>
                          <td className="px-4 py-3.5 text-sm font-semibold">
                            <span className={remaining ? 'text-red-600' : 'text-gray-300'}>
                              {remaining ? fmtCurrency(remaining) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button className="btn btn-ghost btn-sm text-blue-600 text-xs" onClick={(e) => { e.stopPropagation(); setSlipRecord(r); }}>🧾</button>
                              {r.status !== 'paid' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={(e) => { e.stopPropagation(); setPayRecord(r); }}
                                >
                                  <Plus size={12} /> Pay
                                </button>
                              )}
                              <button
                                className="btn btn-ghost btn-sm text-gray-400"
                                onClick={(e) => { e.stopPropagation(); setEditRecord(r); }}
                                title="Edit slip"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm text-red-400"
                                onClick={(e) => { e.stopPropagation(); setConfirmDel(r); }}
                                title="Delete slip"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded transactions */}
                        {isExpanded && r.transactions?.length > 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 pb-3 bg-indigo-50/30">
                              <div className="flex gap-2 flex-wrap pt-2">
                                {r.transactions.map((txn) => (
                                  <div key={txn._id}
                                    className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs shadow-sm">
                                    <span className="font-semibold text-emerald-600">{fmtCurrency(txn.amount)}</span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-500">{METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}</span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-400">{fmtDate(txn.paymentDate)}</span>
                                    {txn.note && <span className="text-gray-400">— {txn.note}</span>}
                                    <button
                                      onClick={() => setConfirmDelPay({ record: r, txnId: txn._id })}
                                      className="text-gray-300 hover:text-red-500 transition ml-1"
                                      aria-label="Remove payment"
                                    >
                                      ✕
                                    </button>
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
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{r.house?.tenantName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.house?.number} · {monthLabel(r.month)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3 bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-gray-400 mb-0.5">Total</p>
                      <p className="font-bold text-gray-900">{fmtCurrency(r.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Paid</p>
                      <p className="font-bold text-emerald-600">{fmtCurrency(r.totalPaid || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Due</p>
                      <p className={`font-bold ${remaining ? 'text-red-600' : 'text-gray-300'}`}>
                        {remaining ? fmtCurrency(remaining) : '—'}
                      </p>
                    </div>
                  </div>

                  {r.transactions?.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {r.transactions.map((txn) => (
                        <div key={txn._id}
                          className="flex items-center gap-2 bg-emerald-50 rounded-lg px-2.5 py-2 text-xs">
                          <span className="font-semibold text-emerald-700">{fmtCurrency(txn.amount)}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}</span>
                          <span className="text-gray-400 ml-auto">{fmtDate(txn.paymentDate)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <button className="btn btn-ghost btn-sm text-blue-600 text-xs border border-gray-100 flex-1 justify-center" onClick={() => setSlipRecord(r)}>🧾 Slip</button>
                    {r.status !== 'paid' && (
                      <button
                        className="btn btn-primary btn-sm flex-1 justify-center"
                        onClick={() => setPayRecord(r)}
                      >
                        <Plus size={13} /> Pay
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm text-red-400"
                      onClick={() => setConfirmDel(r)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon="📋" title="No records"
            description={filterStatus || filterMonth || search ? 'Try adjusting your filters' : 'Rent slips will appear here once generated'}
          />
        </div>
      )}

      <SlipModal      open={!!slipRecord}  payment={slipRecord}  house={slipRecord?.house}  onClose={() => setSlipRecord(null)}  />
      <AddPaymentModal open={!!payRecord}  record={payRecord}                                onClose={() => setPayRecord(null)}   onSave={load} />
      <EditSlipModal  open={!!editRecord}  record={editRecord}                               onClose={() => setEditRecord(null)}  onSave={load} />

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => deleteRecord(confirmDel)}
        title="Delete rent slip?"
        message="This will permanently delete the slip and all its payments. This action cannot be undone."
      />
      <ConfirmDialog
        open={!!confirmDelPay}
        onClose={() => setConfirmDelPay(null)}
        onConfirm={() => deletePayment(confirmDelPay)}
        title="Remove payment?"
        message="This payment entry will be permanently removed from the record."
      />
    </div>
  );
};

export default History;
