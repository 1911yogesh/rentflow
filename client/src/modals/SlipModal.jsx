import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../components/UI';
import { fmtCurrency, fmtDate, monthLabel } from '../utils/helpers';
import { useSettings } from '../context/SettingsContext';

const METHOD_ICONS = { cash: '💵', upi: '📱', bank_transfer: '🏦', cheque: '📄', other: '🔄' };

/**
 * Generates a UPI QR image URL using the qrserver.com API.
 * UPI deep-link format: upi://pay?pa=<id>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 */
const makeUpiQrUrl = (upiId, upiName, amount, upiNote) => {
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName || '')}&am=${amount || ''}&cu=INR&tn=${encodeURIComponent(upiNote || 'Rent Payment')}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiLink)}`;
};

const SlipModal = ({ open, onClose, payment: p, house }) => {
  const slipRef = useRef(null);
  const { settings } = useSettings();

  if (!p || !house) return null;

  const isNew     = !!(p.roomRent?.final !== undefined || p.roomRent?.auto !== undefined);
  const roomRent  = isNew ? (p.roomRent?.final  ?? 0) : (p.roomRent  ?? 0);
  const waterBill = isNew ? (p.waterBill?.final ?? 0) : (p.waterBill ?? 0);
  const elecBill  = isNew ? (p.elecBill?.final  ?? 0) : (p.elecBill  ?? 0);
  const prevDue   = isNew ? (p.previousDue?.final ?? 0) : (p.prevDue ?? 0);
  const totalAmt  = isNew ? (p.totalAmount ?? 0) : (p.totalBill ?? 0);
  const totalPaid = isNew ? (p.totalPaid ?? 0) : (p.paid ?? 0);
  const remaining = Math.max(0, totalAmt - totalPaid);
  const status    = p.status;
  const areaName  = house?.area?.name || '';
  const transactions = p.transactions || [];

  // Electricity display
  const elecIsFixed = p.elecType === 'fixed';
  const elecSubLabel = elecIsFixed
    ? `Fixed amount`
    : settings.showElectricityBreakdown
      ? `Prev: ${p.prevReading} → Curr: ${p.currReading} (${p.units} units × ₹${p.perUnit})`
      : `Prev: ${p.prevReading} → Curr: ${p.currReading}`;

  // QR section
  const showQR     = settings.qrType === 'upi' || settings.qrType === 'custom';
  const qrImageUrl = settings.qrType === 'upi' && settings.upiId
    ? makeUpiQrUrl(settings.upiId, settings.upiName, remaining || totalAmt, settings.upiNote)
    : settings.customQrUrl;

  const downloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;
      const canvas = await html2canvas(slipRef.current, { scale: 2, useCORS: true, allowTaint: true });
      const img    = canvas.toDataURL('image/png');
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, w, h);
      pdf.save(`RentSlip_${house.tenantName}_${p.month}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) { console.error(err); toast.error('Failed to generate PDF'); }
  };

  const downloadImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(slipRef.current, { scale: 2, useCORS: true, allowTaint: true });
      const link   = document.createElement('a');
      link.download = `RentSlip_${house.tenantName}_${p.month}.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image downloaded');
    } catch { toast.error('Failed to generate image'); }
  };

  const printSlip = () => {
    const content = slipRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Rent Slip</title>
      <style>* { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: sans-serif; padding: 24px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { padding: 8px 10px; }
      th { background: #f9fafb; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; }
      td { border-bottom: 1px solid #f3f4f6; }
      img { max-width: 100%; }
      </style></head><body>${content}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>`);
    w.document.close();
  };

  const statusStyle = {
    paid:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: '✅ PAID' },
    partial: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: '⏳ PARTIAL' },
    unpaid:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '❌ UNPAID' },
  }[status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: status?.toUpperCase() };

  return (
    <Modal
      open={open} onClose={onClose}
      title="Rent Slip"
      size="md"
      footer={
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-secondary btn-sm" onClick={printSlip}>🖨️ Print</button>
          <button className="btn btn-secondary btn-sm" onClick={downloadImage}>🖼️ Image</button>
          <button className="btn btn-primary btn-sm"   onClick={downloadPDF}>📄 PDF</button>
        </div>
      }
    >
      {/* Printable slip */}
      <div ref={slipRef} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', fontFamily: 'sans-serif' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb', letterSpacing: '-0.5px' }}>
              🏠 {settings.propertyName || 'RentFlux'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Rent Payment Receipt</div>
            {settings.ownerName && (
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                {settings.ownerName}{settings.ownerPhone ? ` · ${settings.ownerPhone}` : ''}
              </div>
            )}
          </div>
          {p.receiptId && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receipt No.</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{p.receiptId}</div>
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px dashed #e5e7eb', margin: '16px 0' }} />

        {/* Tenant info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            ['Tenant',    house.tenantName],
            ['House No.', house.number],
            ['Area',      areaName],
            ['Month',     monthLabel(p.month)],
            ['Generated', new Date(p.generatedAt || p.createdAt).toLocaleDateString('en-IN')],
            ['Phone',     house.phone],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 600 }}>{lbl}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>{val || '—'}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '2px dashed #e5e7eb', margin: '16px 0' }} />

        {/* Bill table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <SlipRow label="Room Rent" value={fmtCurrency(roomRent)}
              override={isNew && p.roomRent?.overridden} autoVal={isNew ? p.roomRent?.auto : null} />
            <SlipRow label="Water Bill" value={fmtCurrency(waterBill)}
              override={isNew && p.waterBill?.overridden} autoVal={isNew ? p.waterBill?.auto : null} />
            <SlipRow
              label={elecIsFixed ? 'Electricity (Fixed)' : 'Electricity Bill'}
              sub={elecSubLabel}
              value={fmtCurrency(elecBill)}
              override={isNew && p.elecBill?.overridden} autoVal={isNew ? p.elecBill?.auto : null}
            />
            {prevDue > 0 && (
              <SlipRow label="Previous Due" value={fmtCurrency(prevDue)} red
                override={isNew && p.previousDue?.overridden} autoVal={isNew ? p.previousDue?.auto : null} />
            )}
            <tr style={{ background: '#eff6ff' }}>
              <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8', fontSize: '14px' }}>Total Amount</td>
              <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8', fontSize: '14px', textAlign: 'right' }}>{fmtCurrency(totalAmt)}</td>
            </tr>
            <SlipRow label="Total Paid" value={fmtCurrency(totalPaid)} green />
            {remaining > 0 && <SlipRow label="Balance Due" value={fmtCurrency(remaining)} red />}
          </tbody>
        </table>

        <div style={{ borderTop: '2px dashed #e5e7eb', margin: '20px 0 16px' }} />

        {/* Footer: QR + signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
          
          {/* QR Payment Section */}
          {showQR && qrImageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src={qrImageUrl} alt="Payment QR"
                crossOrigin="anonymous"
                style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Scan to Pay</div>
              {settings.qrType === 'upi' && settings.upiId && (
                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>{settings.upiId}</div>
              )}
            </div>
          ) : (
            <div /> /* placeholder for layout */
          )}

          <div style={{ textAlign: 'right' }}>
            {/* Signature */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ width: '100px', borderBottom: '1px solid #374151', marginBottom: '4px', height: '28px', marginLeft: 'auto' }} />
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Owner Signature</div>
            </div>
            {/* Status */}
            <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
              fontWeight: 700, fontSize: '11px', background: statusStyle.bg,
              color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
              {statusStyle.label}
            </div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
              {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {/* Notes */}
        {p.notes && (
          <div style={{ marginTop: '12px', padding: '8px 10px', background: '#fafafa', borderRadius: '6px', fontSize: '11px', color: '#6b7280' }}>
            <strong>Note:</strong> {p.notes}
          </div>
        )}
      </div>

      {/* Payment Timeline */}
      {transactions.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Payment History</p>
          <div className="space-y-2">
            {transactions.map((txn, i) => (
              <div key={txn._id || i} className="flex items-center gap-3 bg-green-50 rounded-lg px-3 py-2.5 text-sm">
                <span className="text-base">{METHOD_ICONS[txn.paymentMethod] || '💳'}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-green-700">{fmtCurrency(txn.amount)}</span>
                  {txn.note && <span className="text-gray-400 text-xs ml-2">— {txn.note}</span>}
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {fmtDate(txn.paymentDate)} · {txn.paymentMethod?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-500">Total Paid</span>
            <span className="font-bold text-green-600">{fmtCurrency(totalPaid)}</span>
          </div>
          {remaining > 0 && (
            <div className="flex justify-between text-sm bg-red-50 rounded-lg px-3 py-2 mt-1">
              <span className="text-gray-500">Remaining Due</span>
              <span className="font-bold text-red-600">{fmtCurrency(remaining)}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

const SlipRow = ({ label, sub, value, red, green, override, autoVal }) => (
  <tr>
    <td style={{ padding: '9px 10px', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ color: red ? '#dc2626' : green ? '#16a34a' : undefined }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
      {override && autoVal !== null && (
        <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px' }}>
          Auto: {fmtCurrency(autoVal)} (overridden)
        </div>
      )}
    </td>
    <td style={{ padding: '9px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right',
      fontWeight: 600, color: red ? '#dc2626' : green ? '#16a34a' : override ? '#d97706' : undefined }}>
      {value}
    </td>
  </tr>
);

export default SlipModal;
