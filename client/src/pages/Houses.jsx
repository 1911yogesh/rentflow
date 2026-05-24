import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, Pencil, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { housesAPI, areasAPI } from '../services/api';
import { fmtCurrency } from '../utils/helpers';
import { EmptyState, PageLoader, StatCard } from '../components/UI';
import HouseModal       from '../modals/HouseModal';
import TenantModal      from '../modals/TenantModal';
import HouseDetailModal from '../modals/HouseDetailModal';

const Houses = () => {
  const { areaId } = useParams();
  const navigate   = useNavigate();

  const [area,    setArea]    = useState(null);
  const [houses,  setHouses]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  // Modal state
  const [houseModal,  setHouseModal]  = useState(false);
  const [editHouse,   setEditHouse]   = useState(null);
  const [tenantHouse, setTenantHouse] = useState(null);
  const [detailHouse, setDetailHouse] = useState(null);  // for HouseDetailModal
  const [confirmDel,  setConfirmDel]  = useState(null);

  // ── Full page load ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [areaRes, housesRes] = await Promise.all([
        areasAPI.getAll(),
        housesAPI.getAll({ area: areaId }),
      ]);
      const foundArea = areaRes.data.data.find(a => a._id === areaId);
      setArea(foundArea || null);
      setHouses(housesRes.data.data);
    } catch {
      toast.error('Failed to load houses');
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => { load(); }, [load]);

  // ── Silently refresh one house in the grid after HouseDetailModal changes ──
  // This keeps the grid live without a full page reload and without closing the detail modal.
  const refreshOneHouse = useCallback(async (houseId) => {
    try {
      const res = await housesAPI.getOne(houseId);
      const updated = res.data.data;
      setHouses(prev => prev.map(h => h._id === houseId ? updated : h));
      // Also keep detailHouse in sync so the modal header reflects changes
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

  // Stats
  const occupied   = houses.filter(h => h.status === 'occupied').length;
  const pendingDue = houses.reduce((s, h) => s + (h.prevDue || 0), 0);

  const displayed = houses.filter(h => {
    const matchSearch =
      (h.number     || '').toLowerCase().includes(search.toLowerCase()) ||
      (h.tenantName || '').toLowerCase().includes(search.toLowerCase()) ||
      (h.phone      || '').includes(search);
    const matchFilter = filter === 'all' || h.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Breadcrumb */}
      <button onClick={() => navigate('/areas')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 mb-4 transition-colors">
        <ChevronLeft size={16} /> Areas
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">{area?.name || 'Houses'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{area?.city} · {houses.length} houses</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary gap-1.5">
          <Plus size={16} /> Add House
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Total"    value={houses.length}           icon="🏠" color="blue"  />
        <StatCard label="Occupied" value={occupied}                icon="👤" color="green" />
        <StatCard label="Pending"  value={fmtCurrency(pendingDue)} icon="⚠️" color="red"   />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search houses or tenants…"
            className="flex-1 text-sm outline-none bg-transparent" />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {['all', 'occupied', 'vacant'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-700'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Houses grid */}
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
            action={!search && (
              <button onClick={openAdd} className="btn btn-primary">Add House</button>
            )}
          />
        </div>
      )}

      {/* ── Modals ── */}

      <HouseModal
        open={houseModal}
        areaId={areaId}
        house={editHouse}
        onClose={() => { setHouseModal(false); setEditHouse(null); }}
        onSave={() => {
          load(); // full reload only for add/edit house config
        }}
      />

      <TenantModal
        open={!!tenantHouse}
        house={tenantHouse}
        onClose={() => setTenantHouse(null)}
        onSave={() => {
          // Refresh just this house card live
          if (tenantHouse?._id) refreshOneHouse(tenantHouse._id);
          setTenantHouse(null);
        }}
      />

      {/* HouseDetailModal: onSave refreshes just that one card live */}
      <HouseDetailModal
        open={!!detailHouse}
        house={detailHouse}
        onClose={() => setDetailHouse(null)}
        onSave={() => {
          if (detailHouse?._id) refreshOneHouse(detailHouse._id);
        }}
      />

      {/* Delete Confirmation */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-3xl mb-3">🗑️</div>
            <p className="font-semibold text-gray-900 mb-1">Delete house "{confirmDel.number}"?</p>
            <p className="text-sm text-gray-500 mb-5">
              All rent records and payment history for this house will also be permanently deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-danger"    onClick={() => handleDelete(confirmDel)}>Delete</button>
            </div>
          </div>
        </div>
      )}
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
      {/* Edit & Delete — always visible */}
      <div className="absolute top-3 right-3 flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
          title="Edit house">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          title="Delete house">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pr-16">
        <div>
          <span className="text-xs font-bold text-blue-600 font-heading">{house.number}</span>
          <p className="font-semibold text-sm mt-0.5">
            {isOccupied ? house.tenantName : 'Vacant'}
          </p>
          <p className="text-xs text-gray-400">
            {isOccupied ? `📞 ${house.phone}` : 'Available for rent'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`badge ${isOccupied ? 'badge-green' : 'badge-gray'}`}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
          {isOccupied && house.prevDue > 0 && <span className="badge badge-red">Due</span>}
        </div>
      </div>

      {/* Rent details */}
      {isOccupied && (
        <div className="bg-gray-50 rounded-lg p-2.5 text-xs grid grid-cols-2 gap-1.5 mb-3">
          <div><span className="text-gray-400">Rent: </span><strong>{fmtCurrency(house.roomRent)}</strong></div>
          <div><span className="text-gray-400">Water: </span><strong>{fmtCurrency(house.waterBill)}</strong></div>
          <div><span className="text-gray-400">Deposit: </span><strong>{fmtCurrency(house.deposit)}</strong></div>
          <div>
            {house.elecType === 'fixed'
              ? <><span className="text-gray-400">Elec: </span><strong>{fmtCurrency(house.elecFixed)}</strong></>
              : <><span className="text-gray-400">Unit: </span><strong>₹{house.elecPerUnit}</strong></>
            }
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
                <p className="text-xs text-green-600 font-semibold">✅ No dues</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] text-gray-400">Prev Reading</p>
                <p className="font-semibold text-xs">{house.prevReading} units</p>
              </div>
              <button onClick={onAddTenant}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Edit tenant">
                <UserPlus size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400">{fmtCurrency(house.roomRent)}/month</p>
            <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={onAddTenant}>
              <UserPlus size={13} /> Add Tenant
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Houses;
