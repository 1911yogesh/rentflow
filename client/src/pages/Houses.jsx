import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { housesAPI, areasAPI } from '../services/api';
import { fmtCurrency, fmtDate, statusColor } from '../utils/helpers';
import { EmptyState, PageLoader, StatCard } from '../components/UI';
import HouseModal      from '../modals/HouseModal';
import TenantModal     from '../modals/TenantModal';
import HouseDetailModal from '../modals/HouseDetailModal';

const Houses = () => {
  const { areaId } = useParams();
  const navigate   = useNavigate();

  const [area,    setArea]    = useState(null);
  const [houses,  setHouses]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const [houseModal,  setHouseModal]  = useState(false);
  const [tenantHouse, setTenantHouse] = useState(null);
  const [detailHouse, setDetailHouse] = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [areaRes, housesRes] = await Promise.all([
        areasAPI.getAll(),
        housesAPI.getAll(areaId),
      ]);
      const foundArea = areaRes.data.data.find((a) => a._id === areaId);
      setArea(foundArea || null);
      setHouses(housesRes.data.data);
    } catch {
      toast.error('Failed to load houses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [areaId]);

  const handleDelete = async (house) => {
    try {
      await housesAPI.remove(house._id);
      toast.success('House deleted');
      load();
    } catch {
      toast.error('Failed to delete house');
    }
    setConfirmDel(null);
  };

  // Derived stats
  const occupied   = houses.filter((h) => h.status === 'occupied').length;
  const vacant     = houses.length - occupied;
  const pendingDue = houses.reduce((s, h) => s + (h.prevDue || 0), 0);

  // Filtered list
  const displayed = houses.filter((h) => {
    const matchSearch =
      h.number.toLowerCase().includes(search.toLowerCase()) ||
      h.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      h.phone.includes(search);
    const matchFilter = filter === 'all' || h.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/areas')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 mb-4 transition-colors"
      >
        <ChevronLeft size={16} /> Areas
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">{area?.name || 'Houses'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{area?.city} · {houses.length} houses</p>
        </div>
        <button onClick={() => setHouseModal(true)} className="btn btn-primary gap-1.5">
          <Plus size={16} /> Add House
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Total"    value={houses.length} icon="🏠" color="blue" />
        <StatCard label="Occupied" value={occupied}       icon="👤" color="green" />
        <StatCard label="Pending"  value={fmtCurrency(pendingDue)} icon="⚠️" color="red" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search houses or tenants…"
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {['all', 'occupied', 'vacant'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Houses grid */}
      {displayed.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((house) => (
            <HouseCard
              key={house._id}
              house={house}
              onClick={() => setDetailHouse(house)}
              onAddTenant={() => setTenantHouse(house)}
              onDelete={() => setConfirmDel(house)}
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
              <button onClick={() => setHouseModal(true)} className="btn btn-primary">Add House</button>
            )}
          />
        </div>
      )}

      {/* Modals */}
      <HouseModal
        open={houseModal} areaId={areaId}
        onClose={() => setHouseModal(false)}
        onSave={load}
      />

      <TenantModal
        open={!!tenantHouse} house={tenantHouse}
        onClose={() => setTenantHouse(null)}
        onSave={load}
      />

      <HouseDetailModal
        open={!!detailHouse} house={detailHouse}
        onClose={() => setDetailHouse(null)}
        onSave={load}
      />

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <p className="font-semibold mb-2">Delete house "{confirmDel.number}"?</p>
            <p className="text-sm text-gray-500 mb-5">All payment history for this house will also be deleted.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDel)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── House Card ─────────────────────────────────────────────────────────────────
const HouseCard = ({ house, onClick, onAddTenant, onDelete }) => {
  const isOccupied = house.status === 'occupied';

  return (
    <div
      className="card p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
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
          {isOccupied && house.prevDue > 0 && (
            <span className="badge badge-red">Due</span>
          )}
        </div>
      </div>

      {isOccupied && (
        <div className="bg-gray-50 rounded-lg p-2.5 text-xs grid grid-cols-2 gap-1.5 mb-3">
          <div><span className="text-gray-400">Rent: </span><strong>{fmtCurrency(house.roomRent)}</strong></div>
          <div><span className="text-gray-400">Water: </span><strong>{fmtCurrency(house.waterBill)}</strong></div>
          <div><span className="text-gray-400">Deposit: </span><strong>{fmtCurrency(house.deposit)}</strong></div>
          <div><span className="text-gray-400">Unit: </span><strong>₹{house.elecPerUnit}</strong></div>
        </div>
      )}

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
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Prev Reading</p>
              <p className="font-semibold text-xs">{house.prevReading} units</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400">{fmtCurrency(house.roomRent)}/month</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={(e) => { e.stopPropagation(); onAddTenant(); }}
            >
              Add Tenant
            </button>
          </>
        )}
      </div>

      {/* Delete button */}
      <button
        className="absolute top-3 right-3 btn btn-ghost p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ position: 'absolute', top: 12, right: 12 }}
        title="Delete house"
      >
        🗑️
      </button>
    </div>
  );
};

export default Houses;
