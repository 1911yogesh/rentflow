import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { areasAPI } from '../services/api';
import { fmtCurrency } from '../utils/helpers';
import { EmptyState, PageLoader, ConfirmDialog, SearchInput, PageHeader } from '../components/UI';
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
      toast.error('Failed to delete area');
    }
  };

  const filtered = areas.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Areas"
        subtitle={`${areas.length} area${areas.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn btn-primary">
            <Plus size={15} /> Add Area
          </button>
        }
      />

      <div className="mb-5 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search areas or cities…" />
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((area) => {
            const pct = area.totalHouses
              ? Math.round((area.occupied / area.totalHouses) * 100) : 0;
            return (
              <div
                key={area._id}
                className="card p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                onClick={() => navigate(`/areas/${area._id}/houses`)}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm font-heading">
                      {area.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-base text-gray-900 leading-tight">
                        {area.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{area.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-2 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      onClick={() => { setEditing(area); setModal(true); }}
                      title="Edit area" aria-label="Edit area"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition"
                      onClick={() => setConfirm(area)}
                      title="Delete area" aria-label="Delete area"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { num: area.totalHouses,                                       lbl: 'Total Houses', cls: 'text-gray-900' },
                    { num: area.occupied,                                           lbl: 'Occupied',     cls: 'text-emerald-600' },
                    { num: area.vacant,                                             lbl: 'Vacant',       cls: 'text-amber-600' },
                    { num: area.pendingDue ? fmtCurrency(area.pendingDue) : '₹0',  lbl: 'Pending Due',  cls: area.pendingDue ? 'text-red-600' : 'text-gray-400' },
                  ].map(({ num, lbl, cls }) => (
                    <div key={lbl} className="bg-gray-50 rounded-xl p-3">
                      <p className={`font-heading font-bold text-xl leading-none ${cls}`}>{num}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">{lbl}</p>
                    </div>
                  ))}
                </div>

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Occupancy</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    View Houses <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={search ? '🔍' : '🗺️'}
            title={search ? 'No areas found' : 'No areas yet'}
            description={
              search
                ? `No results for "${search}"`
                : 'Add your first property area to get started'
            }
            action={
              !search && (
                <button
                  onClick={() => { setEditing(null); setModal(true); }}
                  className="btn btn-primary"
                >
                  Add First Area
                </button>
              )
            }
          />
        </div>
      )}

      <AreaModal
        open={modal}
        area={editing}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={load}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title={`Delete "${confirm?.name}"?`}
        message={`All ${confirm?.totalHouses || 0} house(s) in this area will also be permanently deleted. This cannot be undone.`}
      />
    </div>
  );
};

export default Areas;
