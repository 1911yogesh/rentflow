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

// Builds the pre-filled WhatsApp message for a rent slip.
// Simplified to only include tenant name, month, and total payable —
// full breakdown is in the attached rent slip image/PDF.
export const buildWhatsAppMessage = (record, house) => {
  const { totalAmt } = getSlipAmounts(record);

  return (
    `Hello ${house?.tenantName || 'Tenant'},\n\n` +
    `Your rent slip for ${monthLabel(record?.month)} has been generated.\n\n` +
    `Total Amount Payable: ${fmtCurrency(totalAmt)}\n\n` +
    `Please find the rent slip attached.\n\n` +
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

// End-to-end "Send via WhatsApp" action:
// 1. Auto-downloads the rent slip as a PNG image (so the user can attach it).
// 2. Opens WhatsApp with a pre-filled simplified message.
//
// Why: WhatsApp Web/app does not allow file attachments via wa.me URLs.
// The best achievable UX is: slip is already in Downloads, user just
// taps the attachment icon in WhatsApp and selects the file — one extra tap.
//
// `slipElement` is the DOM node to capture (slipRef.current from SlipModal).
// If not provided, falls back to text-only message (e.g. History/Slips pages).
// Returns true on success, false on failure (toasts handle user feedback).
export const sendSlipViaWhatsApp = async (record, house, slipElement = null) => {
  const phone = house?.whatsappNumber || house?.phone;
  if (!cleanPhone(phone)) {
    toast.error('Tenant phone number is missing. Add it from Edit Tenant.');
    return false;
  }

  try {
    // Step 1: Auto-download slip image so tenant can attach it in WhatsApp.
    if (slipElement) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(slipElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        link.download = `RentSlip_${house.tenantName}_${record.month}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Rent slip image saved — attach it in WhatsApp!', { duration: 5000 });
      } catch (imgErr) {
        console.warn('sendSlipViaWhatsApp: image download failed, continuing without it', imgErr);
        // Non-fatal — still open WhatsApp with the message
      }
    }

    // Step 2: Build simplified WhatsApp message (no link, no breakdown).
    const message = buildWhatsAppMessage(record, house);
    const waUrl   = buildWhatsAppUrl(house, message);
    if (!waUrl) {
      toast.error('Invalid tenant phone number');
      return false;
    }

    // Small delay so the download dialog doesn't compete with the new tab.
    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }, slipElement ? 600 : 0);

    return true;
  } catch (err) {
    console.error('sendSlipViaWhatsApp:', err);
    toast.error('Failed to open WhatsApp');
    return false;
  }
};