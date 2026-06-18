import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, TrendingUp, AlertCircle, Home, DoorOpen,
  Pencil, Trash2, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { rentRecordsAPI, areasAPI } from '../services/api';
import { fmtCurrency, monthLabel, currentMonthLabel, initials } from '../utils/helpers';
import {
  StatCard, CardSkeleton, EmptyState, SectionHeader,
  StatusBadge, ConfirmDialog, PageHeader,
} from '../components/UI';
import AreaModal from '../modals/AreaModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [areas,   setAreas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaModal, setAreaModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, areasRes] = await Promise.all([
        rentRecordsAPI.getDashboard(),
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
      <PageHeader
        title="Dashboard"
        subtitle={currentMonthLabel()}
        action={
          <button onClick={() => setAreaModal(true)} className="btn btn-primary">
            <Plus size={15} /> Add Area
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Collected This Month" icon={<TrendingUp size={18} />}
              value={fmtCurrency(stats?.collected)} color="green"
              sub={`${stats?.recentRecords?.length || 0} slips this month`} />
            <StatCard label="Total Pending Dues" icon={<AlertCircle size={18} />}
              value={fmtCurrency(stats?.totalDue)} color="red"
              sub="Across all tenants" />
            <StatCard label="Occupied Houses" icon={<Home size={18} />}
              value={stats?.occupied ?? '—'} color="blue"
              sub={`of ${stats?.totalHouses ?? 0} total`} />
            <StatCard label="Vacant Houses" icon={<DoorOpen size={18} />}
              value={stats?.vacant ?? '—'} color="amber"
              sub="Available for rent" />
          </>
        )}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        {/* Recent Payments */}
        <div className="card p-5">
          <SectionHeader title="Recent Payments"
            action={
              <button onClick={() => navigate('/history')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition">
                View all <ChevronRight size={13} />
              </button>
            }
          />
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
          ) : stats?.recentRecords?.length ? (
            <div className="divide-y divide-gray-50">
              {stats.recentRecords.map((r) => (
                <div key={r._id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(r.house?.tenantName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.house?.tenantName}</p>
                    <p className="text-xs text-gray-400">
                      {r.house?.number} · {monthLabel(r.month)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-bold text-sm text-emerald-600">{fmtCurrency(r.totalPaid || 0)}</p>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💳" title="No payments yet"
              description="This month's payments will appear here" />
          )}
        </div>

        {/* Area Overview */}
        <div className="card p-5">
          <SectionHeader title="Occupancy Overview"
            action={
              <button onClick={() => navigate('/areas')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition">
                Manage <ChevronRight size={13} />
              </button>
            }
          />
          {loading ? (
            <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
          ) : areas.length ? (
            <div className="space-y-4">
              {areas.map((area) => {
                const pct = area.totalHouses
                  ? Math.round((area.occupied / area.totalHouses) * 100) : 0;
                return (
                  <div key={area._id} className="cursor-pointer group"
                    onClick={() => navigate(`/areas/${area._id}/houses`)}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-sm group-hover:text-indigo-600 transition">{area.name}</span>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{area.occupied}/{area.totalHouses} occupied</span>
                        {area.pendingDue > 0 && (
                          <span className="text-red-500 font-semibold">{fmtCurrency(area.pendingDue)} due</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{pct}% occupied</span>
                      <span className="text-[10px] text-gray-400">{area.vacant} vacant</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="🗺️" title="No areas yet"
              action={<button onClick={() => setAreaModal(true)} className="btn btn-primary btn-sm">Add First Area</button>} />
          )}

          {!loading && areas.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-400">Total Areas</span>
              <strong className="text-gray-900">{areas.length}</strong>
            </div>
          )}
        </div>
      </div>

      {/* All Areas */}
      <SectionHeader
        title="All Areas"
        action={
          <button onClick={() => setAreaModal(true)} className="btn btn-primary btn-sm">
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
          <EmptyState icon="🏘️" title="No areas added yet"
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
  const [editModal,  setEditModal]  = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleDelete = async () => {
    try {
      await areasAPI.remove(area._id);
      toast.success('Area deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete area');
    }
  };

  const occupancyPct = area.totalHouses
    ? Math.round((area.occupied / area.totalHouses) * 100) : 0;

  return (
    <>
      <div
        className="card p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 relative overflow-hidden"
        onClick={() => navigate(`/areas/${area._id}/houses`)}
      >
        {/* Brand accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-base text-gray-900">{area.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{area.city}</p>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditModal(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
              title="Edit area" aria-label="Edit area"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete area" aria-label="Delete area"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { num: area.totalHouses, lbl: 'Total Houses', color: 'text-gray-900' },
            { num: area.occupied,    lbl: 'Occupied',     color: 'text-emerald-600' },
            { num: area.vacant,      lbl: 'Vacant',       color: 'text-amber-600' },
            {
              num: area.pendingDue ? fmtCurrency(area.pendingDue) : '₹0',
              lbl: 'Pending Due',
              color: area.pendingDue ? 'text-red-600' : 'text-gray-400',
            },
          ].map(({ num, lbl, color }) => (
            <div key={lbl} className="bg-gray-50 rounded-xl p-3">
              <p className={`font-heading font-bold text-xl leading-none ${color}`}>{num}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Occupancy bar */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Occupancy</span>
            <span>{occupancyPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </div>

      <AreaModal open={editModal} area={area}
        onClose={() => setEditModal(false)} onSave={onRefresh} />

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={handleDelete}
        title={`Delete "${area.name}"?`}
        message="All houses and rent records in this area will be permanently deleted. This action cannot be undone."
      />
    </>
  );
};

export default Dashboard;
