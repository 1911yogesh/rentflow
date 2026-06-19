import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Printer, Download, FileImage, MessageCircle } from 'lucide-react';
import { Modal } from '../components/UI';
import { fmtCurrency, fmtDate, monthLabel, sendSlipViaWhatsApp } from '../utils/helpers';
import { useSettings } from '../context/SettingsContext';

const makeUpiQrUrl = (upiId, upiName, amount, upiNote) => {
  const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName || '')}&am=${amount || ''}&cu=INR&tn=${encodeURIComponent(upiNote || 'Rent Payment')}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(link)}`;
};

const METHOD_LABELS = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', other: 'Other' };

const SlipModal = ({ open, onClose, payment: p, house }) => {
  const slipRef  = useRef(null);
  const { settings } = useSettings();
  const [sendingWa, setSendingWa] = useState(false);

  if (!p || !house) return null;

  const isNew     = p.roomRent?.final !== undefined || p.roomRent?.auto !== undefined;
  const roomRent  = isNew ? (p.roomRent?.final  ?? 0) : (p.roomRent  ?? 0);
  const waterBill = isNew ? (p.waterBill?.final ?? 0) : (p.waterBill ?? 0);
  const elecBill  = isNew ? (p.elecBill?.final  ?? 0) : (p.elecBill  ?? 0);
  const prevDue   = isNew ? (p.previousDue?.final ?? 0) : (p.prevDue ?? 0);
  const totalAmt  = isNew ? (p.totalAmount ?? 0) : (p.totalBill ?? 0);
  const totalPaid = isNew ? (p.totalPaid ?? 0) : (p.paid ?? 0);
  const remaining = Math.max(0, totalAmt - totalPaid);
  const areaName  = house?.area?.name || p?.house?.area?.name || '';

  const elecIsFixed  = p.elecType === 'fixed';
  const elecSubLabel = elecIsFixed
    ? 'Fixed amount'
    : settings.showElectricityBreakdown
      ? `${p.prevReading} → ${p.currReading} (${p.units} units × ₹${p.perUnit})`
      : `${p.prevReading} → ${p.currReading} units`;

  const showQR     = settings.qrType === 'upi' || settings.qrType === 'custom';
  const qrImageUrl = settings.qrType === 'upi' && settings.upiId
    ? makeUpiQrUrl(settings.upiId, settings.upiName, remaining || totalAmt, settings.upiNote)
    : settings.customQrUrl;

  const downloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;
      const canvas = await html2canvas(slipRef.current, { scale: 2, useCORS: true });
      const img    = canvas.toDataURL('image/png');
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const w = pdf.internal.pageSize.getWidth();
      pdf.addImage(img, 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
      pdf.save(`RentSlip_${house.tenantName}_${p.month}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to generate PDF'); }
  };

  const downloadImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(slipRef.current, { scale: 2, useCORS: true });
      const link   = document.createElement('a');
      link.download = `RentSlip_${house.tenantName}_${p.month}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image downloaded');
    } catch { toast.error('Failed to generate image'); }
  };

  const printSlip = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Rent Slip</title>
      <style>* { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; padding: 24px; }
      </style></head><body>${slipRef.current.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>`);
    w.document.close();
  };

  const sendViaWhatsApp = async () => {
    setSendingWa(true);
    await sendSlipViaWhatsApp(p, house, slipRef.current);
    setSendingWa(false);
  };

  const statusCfg = {
    paid:    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'PAID' },
    partial: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'PARTIALLY PAID' },
    unpaid:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'UNPAID' },
  }[p.status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'UNKNOWN' };

  return (
    <Modal
      open={open} onClose={onClose}
      title="Rent Receipt"
      size="md"
      footer={
        <div className="flex gap-2 flex-wrap items-center">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-secondary btn-sm" onClick={printSlip}>
            <Printer size={13} /> Print
          </button>
          <button className="btn btn-secondary btn-sm" onClick={downloadImage}>
            <FileImage size={13} /> Image
          </button>
          <button className="btn btn-primary btn-sm" onClick={downloadPDF}>
            <Download size={13} /> PDF
          </button>
          <button
            className="btn btn-sm text-white"
            style={{ background: '#25D366' }}
            onClick={sendViaWhatsApp}
            disabled={sendingWa}
          >
            <MessageCircle size={13} />
            {sendingWa ? 'Opening…' : 'WhatsApp'}
          </button>
        </div>
      }
    >
      {/* ── Printable Slip ─────────────────────────────────────────────── */}
      <div
        ref={slipRef}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header band */}
        <div style={{ background: '#4f46e5', padding: '20px 24px 18px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}>
                {settings.propertyName || 'RentFlux'}
              </div>
              {settings.ownerName && (
                <div style={{ fontSize: '11px', marginTop: '3px', opacity: 0.8 }}>
                  {settings.ownerName}{settings.ownerPhone ? ` · ${settings.ownerPhone}` : ''}
                </div>
              )}
              <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.65 }}>Rent Payment Receipt</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {p.receiptId && (
                <>
                  <div style={{ fontSize: '9px', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Receipt No.</div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{p.receiptId}</div>
                </>
              )}
              <div
                style={{
                  marginTop: '6px',
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  background: statusCfg.bg,
                  color: statusCfg.color,
                  border: `1px solid ${statusCfg.border}`,
                }}
              >
                {statusCfg.label}
              </div>
            </div>
          </div>
        </div>

        {/* Tenant grid */}
        <div style={{ padding: '18px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
          {[
            ['Tenant',    house.tenantName],
            ['House',     house.number],
            ['Area',      areaName],
            ['Month',     monthLabel(p.month)],
            ['Phone',     house.phone],
            ['Date',      new Date(p.generatedAt || p.createdAt || Date.now()).toLocaleDateString('en-IN')],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600 }}>{lbl}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>{val || '—'}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ margin: '16px 24px', borderTop: '1px dashed #e5e7eb' }} />

        {/* Bill table */}
        <div style={{ padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th style={{ padding: '8px 0', textAlign: 'left', fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Description</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <SlipRow label="Room Rent" value={fmtCurrency(roomRent)} override={isNew && p.roomRent?.overridden} autoVal={isNew ? p.roomRent?.auto : null} />
              <SlipRow label="Water Bill" value={fmtCurrency(waterBill)} override={isNew && p.waterBill?.overridden} autoVal={isNew ? p.waterBill?.auto : null} />
              <SlipRow
                label={elecIsFixed ? 'Electricity (Fixed)' : 'Electricity Bill'}
                sub={elecSubLabel}
                value={fmtCurrency(elecBill)}
                override={isNew && p.elecBill?.overridden}
                autoVal={isNew ? p.elecBill?.auto : null}
              />
              {prevDue > 0 && (
                <SlipRow label="Previous Due" value={fmtCurrency(prevDue)} red override={isNew && p.previousDue?.overridden} autoVal={isNew ? p.previousDue?.auto : null} />
              )}
            </tbody>
          </table>

          {/* Total band */}
          <div style={{
            margin: '12px 0', padding: '12px 14px', borderRadius: '10px',
            background: '#eef2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#4338ca' }}>Total Amount</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#4338ca' }}>{fmtCurrency(totalAmt)}</span>
          </div>

          {/* Paid / remaining */}
          <div style={{ marginBottom: '4px' }}>
            <SlipRow label="Total Paid" value={fmtCurrency(totalPaid)} green />
            {remaining > 0 && <SlipRow label="Balance Due" value={fmtCurrency(remaining)} red />}
          </div>
        </div>

        {/* Footer: signature + QR */}
        <div style={{ margin: '12px 24px 0', borderTop: '1px dashed #e5e7eb', paddingTop: '16px', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
          {showQR && qrImageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src={qrImageUrl}
                alt="Pay via QR"
                crossOrigin="anonymous"
                style={{ width: '88px', height: '88px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'block' }}
              />
              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>Scan to Pay</div>
              {settings.qrType === 'upi' && settings.upiId && (
                <div style={{ fontSize: '9px', color: '#9ca3af' }}>{settings.upiId}</div>
              )}
            </div>
          ) : <div />}

          <div style={{ textAlign: 'right' }}>
            <div style={{ width: '100px', borderBottom: '1px solid #374151', height: '28px', marginLeft: 'auto', marginBottom: '4px' }} />
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>Authorised Signature</div>
            {p.notes && (
              <div style={{ marginTop: '10px', fontSize: '10px', color: '#6b7280', maxWidth: '180px', textAlign: 'right' }}>
                Note: {p.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment timeline (outside printable area) */}
      {p.transactions?.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Payment History</p>
          <div className="space-y-2">
            {p.transactions.map((txn, i) => (
              <div key={txn._id || i} className="flex items-center gap-3 bg-emerald-50 rounded-xl px-3.5 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">{fmtCurrency(txn.amount)}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {fmtDate(txn.paymentDate)}{txn.note ? ` · ${txn.note}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
            <span className="text-gray-500">Total Paid</span>
            <span className="font-bold text-emerald-600">{fmtCurrency(totalPaid)}</span>
          </div>
          {remaining > 0 && (
            <div className="flex justify-between text-sm bg-red-50 rounded-xl px-4 py-2.5 mt-1.5">
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
    <td style={{ padding: '9px 0', borderBottom: '1px solid #f9fafb' }}>
      <div style={{ color: red ? '#dc2626' : green ? '#15803d' : '#374151', fontSize: '13px' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
      {override && autoVal != null && (
        <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px' }}>Auto: {fmtCurrency(autoVal)} (overridden)</div>
      )}
    </td>
    <td style={{
      padding: '9px 0', borderBottom: '1px solid #f9fafb', textAlign: 'right',
      fontWeight: 600,
      color: red ? '#dc2626' : green ? '#15803d' : override ? '#d97706' : '#111827',
      fontSize: '13px',
    }}>
      {value}
    </td>
  </tr>
);

export default SlipModal;