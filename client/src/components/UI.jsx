import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${maxW} max-h-[90vh] flex flex-col`}
        style={{ animation: 'modalSlideUp 0.2s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold font-heading">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
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
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
          Confirm
        </button>
      </>
    }
  >
    <div className="flex gap-3">
      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </Modal>
);

// ── Empty State ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-16 px-6">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="font-heading font-semibold text-gray-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-400 mb-5">{description}</p>}
    {action && action}
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-heading text-2xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

// ── Form Group ─────────────────────────────────────────────────────────────────
export const FormGroup = ({ label, children, error }) => (
  <div className="mb-4">
    {label && <label className="form-label">{label}</label>}
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// ── Section Header ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-heading font-semibold text-base text-gray-800">{title}</h2>
    {action && action}
  </div>
);

// ── Tabs ───────────────────────────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
          active === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

// ── Loading Spinner ────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    className="animate-spin text-blue-600" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

// ── Page Loader ────────────────────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size={32} />
  </div>
);
