import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';

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

// ── WhatsApp Sharing ─────────────────────────────────────────────────────────

// Normalizes a rent record into the flat amounts used for display/messaging.
// Handles both the "new" override-object shape ({ final, auto, overridden })
// and the legacy flat-number shape, mirroring SlipModal's logic.
export const getSlipAmounts = (p) => {
  const isNew     = !!(p?.roomRent?.final !== undefined || p?.roomRent?.auto !== undefined);
  const roomRent  = isNew ? (p?.roomRent?.final  ?? 0) : (p?.roomRent  ?? 0);
  const waterBill = isNew ? (p?.waterBill?.final ?? 0) : (p?.waterBill ?? 0);
  const elecBill  = isNew ? (p?.elecBill?.final  ?? 0) : (p?.elecBill  ?? 0);
  const prevDue   = isNew ? (p?.previousDue?.final ?? 0) : (p?.prevDue ?? 0);
  const totalAmt  = isNew ? (p?.totalAmount ?? 0) : (p?.totalBill ?? 0);
  const totalPaid = isNew ? (p?.totalPaid ?? 0) : (p?.paid ?? 0);
  const remaining = Math.max(0, totalAmt - totalPaid);
  return { roomRent, waterBill, elecBill, prevDue, totalAmt, totalPaid, remaining };
};

// Builds the pre-filled WhatsApp message for a rent slip, following the
// agreed template. `shareUrl` is the public, tokenized link to the slip.
export const buildWhatsAppMessage = (record, house, shareUrl) => {
  const { roomRent, elecBill, totalAmt, totalPaid, remaining } = getSlipAmounts(record);
  const rentPlusWater = roomRent + (getSlipAmounts(record).waterBill || 0);

  return (
    `Hello ${house?.tenantName || 'Tenant'},\n\n` +
    `Your rent slip for ${monthLabel(record?.month)} is ready.\n\n` +
    `Rent Amount: ${fmtCurrency(rentPlusWater)}\n` +
    `Electricity Amount: ${fmtCurrency(elecBill)}\n` +
    `Total Amount: ${fmtCurrency(totalAmt)}\n` +
    `Paid Amount: ${fmtCurrency(totalPaid)}\n` +
    `Remaining Due: ${fmtCurrency(remaining)}\n\n` +
    `View / download your rent slip here:\n${shareUrl}\n\n` +
    `Thank you.`
  );
};

// Cleans a phone number to digits only (strips spaces, dashes, '+', etc.)
export const cleanPhone = (n = '') => String(n).replace(/\D/g, '');

// Builds a wa.me URL that opens a chat directly with the tenant, with the
// message pre-filled. No need to save the number in contacts.
export const buildWhatsAppUrl = (house, message) => {
  const cc    = cleanPhone(house?.countryCode || '91') || '91';
  const raw   = house?.whatsappNumber || house?.phone || '';
  const phone = cleanPhone(raw);
  if (!phone) return null;
  // If the stored number already includes the country code (>10 digits for IN
  // style numbers), don't double-prefix it.
  const full = phone.length > 10 ? phone : `${cc}${phone}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
};

// End-to-end "Send via WhatsApp" action: fetches/creates a secure share link
// for the slip, builds the pre-filled message, and opens WhatsApp directly to
// the tenant's chat. Used by SlipModal, History, and Slips pages.
// Returns true on success, false on failure (toasts handle user feedback).
export const sendSlipViaWhatsApp = async (record, house) => {
  const phone = house?.whatsappNumber || house?.phone;
  if (!cleanPhone(phone)) {
    toast.error('Tenant phone number is missing. Add it from Edit Tenant.');
    return false;
  }
  try {
    const res = await rentRecordsAPI.getShareLink(record._id);
    const token = res?.data?.data?.token;
    if (!token) throw new Error('No token');

    const shareUrl = `${window.location.origin}/share/${token}`;
    const message  = buildWhatsAppMessage(record, house, shareUrl);
    const waUrl    = buildWhatsAppUrl(house, message);
    if (!waUrl) {
      toast.error('Invalid tenant phone number');
      return false;
    }

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp…');
    return true;
  } catch (err) {
    console.error('sendSlipViaWhatsApp:', err);
    toast.error('Failed to generate share link');
    return false;
  }
};
