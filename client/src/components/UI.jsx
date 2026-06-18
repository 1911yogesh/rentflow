import React from 'react';
import { X, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';

// ── Skeleton ───────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const CardSkeleton = () => (
  <div className="card p-5 space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

// ── Modal ──────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white w-full ${maxW} flex flex-col
          rounded-t-3xl sm:rounded-2xl
          max-h-[95vh] sm:max-h-[90vh]
          shadow-modal`}
        style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-bold font-heading text-gray-900 truncate">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Drag indicator (mobile) */}
        <div className="sm:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0 bg-gray-50/80 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { transform: translateY(24px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger = true }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm"
    footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {danger ? 'Delete' : 'Confirm'}
        </button>
      </>
    }
  >
    <div className="flex gap-3 items-start">
      <div className="p-2 bg-amber-50 rounded-xl shrink-0">
        <AlertTriangle className="text-amber-500" size={20} />
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mt-1">{message}</p>
    </div>
  </Modal>
);

// ── Empty State ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-14 px-6">
    <div className="text-4xl mb-3 opacity-60">{icon}</div>
    <h3 className="font-heading font-semibold text-gray-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">{description}</p>}
    {action && action}
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, color = 'blue' }) => {
  const colors = {
    blue:   'bg-indigo-50 text-indigo-600',
    green:  'bg-emerald-50 text-emerald-600',
    red:    'bg-red-50 text-red-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="font-heading text-2xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
};

// ── Form Group ─────────────────────────────────────────────────────────────────
export const FormGroup = ({ label, children, error, hint }) => (
  <div className="mb-4">
    {label && <label className="form-label">{label}</label>}
    {children}
    {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span>{error}</p>}
  </div>
);

// ── Section Header ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-heading font-bold text-sm text-gray-700 uppercase tracking-wider">{title}</h2>
    {action && action}
  </div>
);

// ── Tabs ───────────────────────────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
          active === t.key
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

// ── Loading Spinner ────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    className="animate-spin text-indigo-600" stroke="currentColor" strokeWidth="2.5"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

// ── Page Loader ────────────────────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size={32} />
  </div>
);

// ── Status Badge — strongly visible payment status ─────────────────────────────
export const StatusBadge = ({ status }) => {
  const config = {
    paid:    { cls: 'status-paid',    icon: <CheckCircle2 size={12} />, label: 'Paid' },
    partial: { cls: 'status-partial', icon: <Clock size={12} />,        label: 'Partial' },
    unpaid:  { cls: 'status-unpaid',  icon: <XCircle size={12} />,      label: 'Unpaid' },
  }[status] || { cls: 'badge-gray', icon: null, label: status };

  return (
    <span className={`status-pill ${config.cls}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ── Page Header ────────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6 gap-3">
    <div>
      <h1 className="font-heading text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ── Search Input ───────────────────────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
    <svg className="text-gray-400 shrink-0" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
    />
    {value && (
      <button onClick={() => onChange('')} className="text-gray-300 hover:text-gray-500 transition">
        <X size={14} />
      </button>
    )}
  </div>
);

// ── Divider ────────────────────────────────────────────────────────────────────
export const Divider = ({ label }) =>
  label ? (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  ) : <div className="h-px bg-gray-100 my-4" />;
