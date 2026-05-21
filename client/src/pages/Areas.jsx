import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { areasAPI } from '../services/api';
import { fmtCurrency, initials } from '../utils/helpers';
import { EmptyState, PageLoader, SectionHeader } from '../components/UI';
import AreaModal from '../modals/AreaModal';

const Areas = () => {
  const navigate = useNavigate();
  const [areas,   setAreas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await areasAPI.getAll();
      setAreas(res.data.data);
    } catch {
      toast.error('Failed to load areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (area) => {
    try {
      await areasAPI.remove(area._id);
      toast.success('Area deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
    setConfirm(null);
  };

  const filtered = areas.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Areas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{areas.length} areas total</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }} className="btn btn-primary gap-1.5">
          <Plus size={16} /> Add Area
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-6 max-w-sm">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search areas…"
          className="flex-1 text-sm outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((area) => (
            <div
              key={area._id}
              className="card p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 relative overflow-hidden"
              onClick={() => navigate(`/areas/${area._id}/houses`)}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {area.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base leading-tight">{area.name}</h3>
                    <p className="text-xs text-gray-400">{area.city}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost p-1.5 text-gray-400 hover:text-blue-600"
                    onClick={() => { setEditing(area); setModal(true); }}
                    title="Edit"
                  >✏️</button>
                  <button
                    className="btn btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                    onClick={() => setConfirm(area)}
                    title="Delete"
                  >🗑️</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { num: area.totalHouses, lbl: 'Total Houses' },
                  { num: area.occupied,    lbl: 'Occupied',    cls: 'text-green-600' },
                  { num: area.vacant,      lbl: 'Vacant',      cls: 'text-amber-600' },
                  {
                    num: area.pendingDue ? fmtCurrency(area.pendingDue) : '—',
                    lbl: 'Pending Due',
                    cls: area.pendingDue ? 'text-red-600' : 'text-gray-400',
                  },
                ].map(({ num, lbl, cls = '' }) => (
                  <div key={lbl} className="bg-[#f0ede8] rounded-lg p-2.5">
                    <p className={`font-heading font-bold text-lg leading-none ${cls}`}>{num}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{lbl}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-end">
                <span className="badge badge-blue text-[10px]">View Houses →</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={search ? '🔍' : '🗺️'}
            title={search ? 'No areas found' : 'No areas yet'}
            description={search ? `No results for "${search}"` : 'Add your first property area to get started'}
            action={!search && (
              <button onClick={() => { setEditing(null); setModal(true); }} className="btn btn-primary">
                Add First Area
              </button>
            )}
          />
        </div>
      )}

      {/* Area modal */}
      <AreaModal
        open={modal} area={editing}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={load}
      />

      {/* Confirm delete */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <p className="font-semibold mb-2">Delete "{confirm.name}"?</p>
            <p className="text-sm text-gray-500 mb-5">
              All {confirm.totalHouses} house(s) in this area will also be deleted. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirm)}>Delete Area</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Areas;
