import { format, parseISO } from 'date-fns';

export const fmtCurrency = (n) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN');

export const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : new Date(d), 'dd MMM yyyy'); }
  catch { return '—'; }
};

export const monthLabel = (m) => {
  if (!m) return '—';
  const [y, mo] = m.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(mo) - 1]} ${y}`;
};

export const currentMonth = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

export const currentMonthLabel = () => monthLabel(currentMonth());

export const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export const statusColor = (status) => ({
  paid:    'badge-green',
  partial: 'badge-amber',
  unpaid:  'badge-red',
  occupied:'badge-green',
  vacant:  'badge-gray',
}[status] || 'badge-gray');

export const calcElec = (units, perUnit) => Math.max(0, units) * (perUnit || 0);
export const calcUnits = (curr, prev) => Math.max(0, (curr || 0) - (prev || 0));
