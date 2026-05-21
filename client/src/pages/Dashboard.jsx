import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, AlertCircle, Home, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsAPI, areasAPI } from '../services/api';
import { fmtCurrency, monthLabel, currentMonthLabel, initials, statusColor } from '../utils/helpers';
import { StatCard, CardSkeleton, EmptyState, SectionHeader } from '../components/UI';
import AreaModal from '../modals/AreaModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats,  setStats]  = useState(null);
  const [areas,  setAreas]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaModal, setAreaModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, areasRes] = await Promise.all([
        paymentsAPI.dashboard(),
        areasAPI.getAll(),
      ]);
      setStats(dashRes.data.data);
      setAreas(areasRes.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{currentMonthLabel()}</p>
        </div>
        <button onClick={() => setAreaModal(true)} className="btn btn-primary gap-2">
          <Plus size={16} /> Add Area
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Collected This Month" icon={<TrendingUp size={18} />}
              value={fmtCurrency(stats?.collected)} color="green"
              sub={`${stats?.recentPayments?.length || 0} payments`}
            />
            <StatCard
              label="Total Pending Dues" icon={<AlertCircle size={18} />}
              value={fmtCurrency(stats?.totalDue)} color="red"
              sub="Across all tenants"
            />
            <StatCard
              label="Occupied Houses" icon={<Home size={18} />}
              value={stats?.occupied ?? '—'} color="blue"
              sub={`of ${stats?.totalHouses ?? 0} total`}
            />
            <StatCard
              label="Vacant Houses" icon={<Key size={18} />}
              value={stats?.vacant ?? '—'} color="amber"
              sub="Available for rent"
            />
          </>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Recent Payments */}
        <div className="card p-5">
          <SectionHeader
            title="Recent Payments"
            action={
              <button onClick={() => navigate('/history')} className="btn btn-ghost btn-sm text-blue-600">
                View all →
              </button>
            }
          />
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
          ) : stats?.recentPayments?.length ? (
            <div className="divide-y divide-gray-50">
              {stats.recentPayments.map((p) => (
                <div key={p._id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(p.house?.tenantName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.house?.tenantName}</p>
                    <p className="text-xs text-gray-400">
                      {p.house?.number} · {monthLabel(p.month)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-green-600">{fmtCurrency(p.paid)}</p>
                    <span className={`badge ${statusColor(p.status)} text-[10px]`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💳" title="No payments yet" description="Payments recorded this month will appear here" />
          )}
        </div>

        {/* Area Overview */}
        <div className="card p-5">
          <SectionHeader
            title="Area Overview"
            action={
              <button onClick={() => navigate('/areas')} className="btn btn-ghost btn-sm text-blue-600">
                Manage →
              </button>
            }
          />
          {loading ? (
            <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
          ) : areas.length ? (
            <div className="space-y-4">
              {areas.map((area) => {
                const pct = area.totalHouses
                  ? Math.round((area.occupied / area.totalHouses) * 100)
                  : 0;
                return (
                  <div
                    key={area._id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/areas/${area._id}/houses`)}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-sm">{area.name}</span>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{area.occupied}/{area.totalHouses} occupied</span>
                        {area.pendingDue > 0 && (
                          <span className="text-red-500 font-semibold">{fmtCurrency(area.pendingDue)} due</span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="🗺️" title="No areas yet" action={
              <button onClick={() => setAreaModal(true)} className="btn btn-primary btn-sm">Add First Area</button>
            } />
          )}

          {/* Summary row */}
          {!loading && areas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-400">Total Areas</span>
              <strong>{areas.length}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Area cards */}
      <SectionHeader
        title="All Areas"
        action={
          <button onClick={() => setAreaModal(true)} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={14} /> Add Area
          </button>
        }
      />
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : areas.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <AreaCard key={area._id} area={area} onRefresh={load} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon="🏘️" title="No areas added yet"
            description="Start by adding your first property area"
            action={<button onClick={() => setAreaModal(true)} className="btn btn-primary">Add Area</button>}
          />
        </div>
      )}

      <AreaModal open={areaModal} onClose={() => setAreaModal(false)} onSave={load} />
    </div>
  );
};

// ── Area Card ──────────────────────────────────────────────────────────────────
const AreaCard = ({ area, onRefresh, navigate }) => {
  const [editModal, setEditModal]     = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);

  const handleDelete = async () => {
    try {
      await areasAPI.remove(area._id);
      toast.success('Area deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete area');
    }
  };

  return (
    <>
      <div
        className="card p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 relative overflow-hidden"
        onClick={() => navigate(`/areas/${area._id}/houses`)}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-base">{area.name}</h3>
            <p className="text-xs text-gray-400">{area.city}</p>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditModal(true)} className="btn btn-ghost p-1.5 text-xs">✏️</button>
            <button onClick={() => setConfirmDel(true)} className="btn btn-ghost p-1.5 text-xs">🗑️</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { num: area.totalHouses, lbl: 'Total Houses' },
            { num: area.occupied,    lbl: 'Occupied',  color: 'text-green-600' },
            { num: area.vacant,      lbl: 'Vacant',    color: 'text-amber-600' },
            { num: area.pendingDue ? fmtCurrency(area.pendingDue) : '—', lbl: 'Pending Due', color: area.pendingDue ? 'text-red-600' : '' },
          ].map(({ num, lbl, color = '' }) => (
            <div key={lbl} className="bg-[#f0ede8] rounded-lg p-2.5">
              <p className={`font-heading font-bold text-lg leading-none ${color}`}>{num}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{lbl}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <span className="badge badge-blue text-[10px]">View Houses →</span>
        </div>
      </div>

      <AreaModal
        open={editModal} area={area}
        onClose={() => setEditModal(false)}
        onSave={onRefresh}
      />

      {/* Inline confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <p className="font-semibold mb-2">Delete {area.name}?</p>
            <p className="text-sm text-gray-500 mb-5">All houses in this area will be deleted. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDel(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { setConfirmDel(false); handleDelete(); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
