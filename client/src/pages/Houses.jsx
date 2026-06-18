import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, ChevronLeft, Pencil, Trash2, UserPlus,
  Home, Users, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { housesAPI, areasAPI } from '../services/api';
import { fmtCurrency } from '../utils/helpers';
import {
  EmptyState, PageLoader, StatCard, ConfirmDialog,
  SearchInput, Tabs,
} from '../components/UI';
import HouseModal       from '../modals/HouseModal';
import TenantModal      from '../modals/TenantModal';
import HouseDetailModal from '../modals/HouseDetailModal';

const FILTER_TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'occupied', label: 'Occupied' },
  { key: 'vacant',   label: 'Vacant'   },
];

const Houses = () => {
  const { areaId } = useParams();
  const navigate   = useNavigate();

  const [area,    setArea]    = useState(null);
  const [houses,  setHouses]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const [houseModal,  setHouseModal]  = useState(false);
  const [editHouse,   setEditHouse]   = useState(null);
  const [tenantHouse, setTenantHouse] = useState(null);
  const [detailHouse, setDetailHouse] = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [areaRes, housesRes] = await Promise.all([
        areasAPI.getAll(),
        housesAPI.getAll({ area: areaId }),
      ]);
      setArea(areaRes.data.data.find(a => a._id === areaId) || null);
      setHouses(housesRes.data.data);
    } catch {
      toast.error('Failed to load houses');
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => { load(); }, [load]);

  const refreshOneHouse = useCallback(async (houseId) => {
    try {
      const res = await housesAPI.getOne(houseId);
      const updated = res.data.data;
      setHouses(prev => prev.map(h => h._id === houseId ? updated : h));
      setDetailHouse(prev => prev?._id === houseId ? updated : prev);
    } catch { /* ignore */ }
  }, []);

  const handleDelete = async (house) => {
    try {
      await housesAPI.remove(house._id);
      toast.success('House deleted');
      setHouses(prev => prev.filter(h => h._id !== house._id));
    } catch {
      toast.error('Failed to delete house');
    }
    setConfirmDel(null);
  };

  const openAdd  = ()      => { setEditHouse(null);  setHouseModal(true); };
  const openEdit = (house) => { setEditHouse(house); setHouseModal(true); };

  const occupied   = houses.filter(h => h.status === 'occupied').length;
  const pendingDue = houses.reduce((s, h) => s + (h.prevDue || 0), 0);

  const displayed = houses.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (h.number     || '').toLowerCase().includes(q) ||
      (h.tenantName || '').toLowerCase().includes(q) ||
      (h.phone      || '').includes(search);
    const matchFilter = filter === 'all' || h.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/areas')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 mb-4 transition-colors font-medium"
      >
        <ChevronLeft size={16} /> Areas
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">{area?.name || 'Houses'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {area?.city} · {houses.length} {houses.length === 1 ? 'house' : 'houses'}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary shrink-0">
          <Plus size={15} /> Add House
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Total"    value={houses.length}           icon={<Home size={18}/>}        color="blue"  />
        <StatCard label="Occupied" value={occupied}                icon={<Users size={18}/>}       color="green" />
        <StatCard label="Pending"  value={fmtCurrency(pendingDue)} icon={<AlertCircle size={18}/>} color="red"   />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search houses or tenants…"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {FILTER_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {displayed.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(house => (
            <HouseCard
              key={house._id}
              house={house}
              onClick={() => setDetailHouse(house)}
              onEdit={e      => { e.stopPropagation(); openEdit(house); }}
              onAddTenant={e => { e.stopPropagation(); setTenantHouse(house); }}
              onDelete={e    => { e.stopPropagation(); setConfirmDel(house); }}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={search ? '🔍' : '🏠'}
            title={search ? 'No houses found' : 'No houses yet'}
            description={search ? `No results for "${search}"` : 'Add the first house to this area'}
            action={!search && <button onClick={openAdd} className="btn btn-primary">Add House</button>}
          />
        </div>
      )}

      {/* Modals */}
      <HouseModal
        open={houseModal} areaId={areaId} house={editHouse}
        onClose={() => { setHouseModal(false); setEditHouse(null); }}
        onSave={load}
      />
      <TenantModal
        open={!!tenantHouse} house={tenantHouse}
        onClose={() => setTenantHouse(null)}
        onSave={() => {
          if (tenantHouse?._id) refreshOneHouse(tenantHouse._id);
          setTenantHouse(null);
        }}
      />
      <HouseDetailModal
        open={!!detailHouse} house={detailHouse}
        onClose={() => setDetailHouse(null)}
        onSave={() => { if (detailHouse?._id) refreshOneHouse(detailHouse._id); }}
      />
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => handleDelete(confirmDel)}
        title={`Delete "${confirmDel?.number}"?`}
        message="All rent records and payment history for this house will also be permanently deleted."
      />
    </div>
  );
};

// ── House Card ─────────────────────────────────────────────────────────────────
const HouseCard = ({ house, onClick, onEdit, onAddTenant, onDelete }) => {
  const isOccupied = house.status === 'occupied';

  return (
    <div
      className="card p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 relative"
      onClick={onClick}
    >
      {/* Occupied indicator strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${isOccupied ? 'bg-emerald-400' : 'bg-gray-200'}`} />

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
        <button onClick={onEdit}
          className="p-2 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition"
          title="Edit house" aria-label="Edit house">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete}
          className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition"
          title="Delete house" aria-label="Delete house">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Header */}
      <div className="mb-3 pr-16">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-indigo-600 font-heading">{house.number}</span>
          <span className={`badge ${isOccupied ? 'badge-green' : 'badge-gray'}`}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
          {isOccupied && house.prevDue > 0 && (
            <span className="badge badge-red">Due</span>
          )}
        </div>
        <p className="font-semibold text-sm text-gray-900">
          {isOccupied ? house.tenantName : 'Vacant — Available'}
        </p>
        {isOccupied && (
          <p className="text-xs text-gray-400 mt-0.5">{house.phone}</p>
        )}
      </div>

      {/* Rent breakdown */}
      {isOccupied && (
        <div className="bg-gray-50 rounded-xl p-3 text-xs grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Rent</span>
            <strong>{fmtCurrency(house.roomRent)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Water</span>
            <strong>{fmtCurrency(house.waterBill)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Deposit</span>
            <strong>{fmtCurrency(house.deposit)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">
              {house.elecType === 'fixed' ? 'Elec' : 'Unit'}
            </span>
            <strong>
              {house.elecType === 'fixed'
                ? fmtCurrency(house.elecFixed)
                : `₹${house.elecPerUnit}`}
            </strong>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {isOccupied ? (
          <>
            <div>
              {house.prevDue > 0 ? (
                <>
                  <p className="font-bold text-sm text-red-600">{fmtCurrency(house.prevDue)}</p>
                  <p className="text-[10px] text-gray-400">Previous Due</p>
                </>
              ) : (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <span>✓</span> No dues
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] text-gray-400">Prev Reading</p>
                <p className="font-semibold text-xs">{house.prevReading} units</p>
              </div>
              <button onClick={onAddTenant}
                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="Edit tenant" aria-label="Edit tenant">
                <UserPlus size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400">{fmtCurrency(house.roomRent)}/month</p>
            <button className="btn btn-primary btn-sm" onClick={onAddTenant}>
              <UserPlus size={13} /> Add Tenant
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Houses;
