import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Printer, Download, Building2, AlertTriangle } from 'lucide-react';
import { rentRecordsAPI } from '../services/api';
import { fmtCurrency, fmtDate, monthLabel, getSlipAmounts } from '../utils/helpers';
import { PageLoader, EmptyState } from '../components/UI';

const METHOD_LABELS = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', other: 'Other' };

const makeUpiQrUrl = (upiId, upiName, amount, upiNote) => {
  const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName || '')}&am=${amount || ''}&cu=INR&tn=${encodeURIComponent(upiNote || 'Rent Payment')}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(link)}`;
};

// Public, unauthenticated view of a rent slip — opened via the tokenized
// link shared over WhatsApp. Lets the tenant view, print, or download the
// slip themselves, without needing to log in.
const SharedSlip = () => {
  const { token } = useParams();
  const slipRef = useRef(null);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await rentRecordsAPI.getSharedSlip(token);
        setData(res.data.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'This link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const downloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;
      const canvas = await html2canvas(slipRef.current, { scale: 2, useCORS: true });
      const img    = canvas.toDataURL('image/png');
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const w = pdf.internal.pageSize.getWidth();
      pdf.addImage(img, 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
      pdf.save(`RentSlip_${data?.house?.tenantName || 'slip'}_${data?.record?.month}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to generate PDF'); }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
        <PageLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] p-4">
        <div className="card max-w-sm w-full p-2">
          <EmptyState
            icon={<AlertTriangle className="text-amber-400 mx-auto" size={36} />}
            title="Link unavailable"
            description={error || 'This rent slip could not be found.'}
          />
        </div>
      </div>
    );
  }

  const { record: p, house, settings = {} } = data;
  const { roomRent, waterBill, elecBill, prevDue, totalAmt, totalPaid, remaining } = getSlipAmounts(p);
  const transactions = p.transactions || [];

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

  const statusCfg = {
    paid:    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'PAID' },
    partial: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'PARTIALLY PAID' },
    unpaid:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'UNPAID' },
  }[p.status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: (p.status || '').toUpperCase() };

  return (
    <div className="min-h-screen bg-[#f4f6f8] py-6 px-3 sm:px-4">
      <div className="max-w-md mx-auto">

        {/* Branding row above the slip */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 size={13} className="text-white" />
          </div>
          <span className="font-heading font-bold text-sm text-gray-700">
            {settings.propertyName || 'RentFlux'}
          </span>
        </div>

        <div
          ref={slipRef}
          style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}
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
                <div style={{
                  marginTop: '6px', display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                  background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                }}>
                  {statusCfg.label}
                </div>
              </div>
            </div>
          </div>

          {/* Tenant info grid */}
          <div style={{ padding: '18px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
            {[
              ['Tenant',  house.tenantName],
              ['House',   house.number],
              ['Area',    house?.area?.name || ''],
              ['Month',   monthLabel(p.month)],
              ['Phone',   house.phone],
              ['Date',    new Date(p.generatedAt || p.createdAt).toLocaleDateString('en-IN')],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600 }}>{lbl}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>{val || '—'}</div>
              </div>
            ))}
          </div>

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
                <Row label="Room Rent" value={fmtCurrency(roomRent)} />
                <Row label="Water Bill" value={fmtCurrency(waterBill)} />
                <Row label={elecIsFixed ? 'Electricity (Fixed)' : 'Electricity Bill'} sub={elecSubLabel} value={fmtCurrency(elecBill)} />
                {prevDue > 0 && <Row label="Previous Due" value={fmtCurrency(prevDue)} red />}
              </tbody>
            </table>

            <div style={{ margin: '12px 0', padding: '12px 14px', borderRadius: '10px', background: '#eef2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#4338ca' }}>Total Amount</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#4338ca' }}>{fmtCurrency(totalAmt)}</span>
            </div>

            <div style={{ marginBottom: '4px' }}>
              <Row label="Total Paid" value={fmtCurrency(totalPaid)} green />
              {remaining > 0 && <Row label="Balance Due" value={fmtCurrency(remaining)} red />}
            </div>
          </div>

          {/* Footer: QR + date */}
          <div style={{ margin: '12px 24px 0', borderTop: '1px dashed #e5e7eb', paddingTop: '16px', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
            {showQR && qrImageUrl ? (
              <div style={{ textAlign: 'center' }}>
                <img src={qrImageUrl} alt="Pay via QR" crossOrigin="anonymous"
                  style={{ width: '88px', height: '88px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'block' }} />
                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>Scan to Pay</div>
                {settings.qrType === 'upi' && settings.upiId && (
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>{settings.upiId}</div>
                )}
              </div>
            ) : <div />}

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                Generated {new Date().toLocaleDateString('en-IN')}
              </div>
              {p.notes && (
                <div style={{ marginTop: '10px', fontSize: '10px', color: '#6b7280', maxWidth: '180px', textAlign: 'right' }}>
                  Note: {p.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment history */}
        {transactions.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Payment History</p>
            <div className="space-y-2">
              {transactions.map((txn, i) => (
                <div key={i} className="flex items-center gap-3 bg-emerald-50 rounded-xl px-3.5 py-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{fmtCurrency(txn.amount)}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}</span>
                    </div>
                    {txn.note && <p className="text-[11px] text-gray-400 mt-0.5">{txn.note}</p>}
                    <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(txn.paymentDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap mt-5 justify-center">
          <button className="btn btn-secondary btn-sm" onClick={printSlip}>
            <Printer size={13} /> Print
          </button>
          <button className="btn btn-primary btn-sm" onClick={downloadPDF}>
            <Download size={13} /> Download PDF
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by {settings.propertyName || 'RentFlux'}
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, sub, value, red, green }) => (
  <tr>
    <td style={{ padding: '9px 0', borderBottom: '1px solid #f9fafb' }}>
      <div style={{ color: red ? '#dc2626' : green ? '#15803d' : '#374151', fontSize: '13px' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
    </td>
    <td style={{ padding: '9px 0', borderBottom: '1px solid #f9fafb', textAlign: 'right', fontWeight: 600, fontSize: '13px', color: red ? '#dc2626' : green ? '#15803d' : '#111827' }}>
      {value}
    </td>
  </tr>
);

export default SharedSlip;
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { rentRecordsAPI } from '../services/api';
import { fmtCurrency, fmtDate, monthLabel, getSlipAmounts } from '../utils/helpers';
import { PageLoader, EmptyState } from '../components/UI';

const METHOD_ICONS = { cash: '💵', upi: '📱', bank_transfer: '🏦', cheque: '📄', other: '🔄' };

const makeUpiQrUrl = (upiId, upiName, amount, upiNote) => {
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName || '')}&am=${amount || ''}&cu=INR&tn=${encodeURIComponent(upiNote || 'Rent Payment')}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiLink)}`;
};

// Public, unauthenticated view of a rent slip — opened via the tokenized
// link shared over WhatsApp. Lets the tenant view, print, or download the
// slip themselves, without needing to log in.
const SharedSlip = () => {
  const { token } = useParams();
  const slipRef = useRef(null);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await rentRecordsAPI.getSharedSlip(token);
        setData(res.data.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'This link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

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
      pdf.save(`RentSlip_${data?.house?.tenantName || 'slip'}_${data?.record?.month}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) { console.error(err); toast.error('Failed to generate PDF'); }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <PageLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-sm w-full">
          <EmptyState icon="⚠️" title="Link unavailable" description={error || 'Slip not found'} />
        </div>
      </div>
    );
  }

  const { record: p, house, settings = {} } = data;
  const { roomRent, waterBill, elecBill, prevDue, totalAmt, totalPaid, remaining } = getSlipAmounts(p);
  const transactions = p.transactions || [];

  const elecIsFixed = p.elecType === 'fixed';
  const elecSubLabel = elecIsFixed
    ? 'Fixed amount'
    : settings.showElectricityBreakdown
      ? `Prev: ${p.prevReading} → Curr: ${p.currReading} (${p.units} units × ₹${p.perUnit})`
      : `Prev: ${p.prevReading} → Curr: ${p.currReading}`;

  const showQR     = settings.qrType === 'upi' || settings.qrType === 'custom';
  const qrImageUrl = settings.qrType === 'upi' && settings.upiId
    ? makeUpiQrUrl(settings.upiId, settings.upiName, remaining || totalAmt, settings.upiNote)
    : settings.customQrUrl;

  const statusStyle = {
    paid:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: '✅ PAID' },
    partial: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: '⏳ PARTIAL' },
    unpaid:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '❌ UNPAID' },
  }[p.status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: p.status?.toUpperCase() };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-4">
      <div className="max-w-md mx-auto">
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
              ['Area',      house?.area?.name || ''],
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
              <Row label="Room Rent" value={fmtCurrency(roomRent)} />
              <Row label="Water Bill" value={fmtCurrency(waterBill)} />
              <Row label={elecIsFixed ? 'Electricity (Fixed)' : 'Electricity Bill'} sub={elecSubLabel} value={fmtCurrency(elecBill)} />
              {prevDue > 0 && <Row label="Previous Due" value={fmtCurrency(prevDue)} red />}
              <tr style={{ background: '#eff6ff' }}>
                <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8', fontSize: '14px' }}>Total Amount</td>
                <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8', fontSize: '14px', textAlign: 'right' }}>{fmtCurrency(totalAmt)}</td>
              </tr>
              <Row label="Total Paid" value={fmtCurrency(totalPaid)} green />
              {remaining > 0 && <Row label="Balance Due" value={fmtCurrency(remaining)} red />}
            </tbody>
          </table>

          <div style={{ borderTop: '2px dashed #e5e7eb', margin: '20px 0 16px' }} />

          {/* Footer: QR + status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
            {showQR && qrImageUrl ? (
              <div style={{ textAlign: 'center' }}>
                <img src={qrImageUrl} alt="Payment QR" crossOrigin="anonymous"
                  style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Scan to Pay</div>
                {settings.qrType === 'upi' && settings.upiId && (
                  <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>{settings.upiId}</div>
                )}
              </div>
            ) : <div />}

            <div style={{ textAlign: 'right' }}>
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

          {p.notes && (
            <div style={{ marginTop: '12px', padding: '8px 10px', background: '#fafafa', borderRadius: '6px', fontSize: '11px', color: '#6b7280' }}>
              <strong>Note:</strong> {p.notes}
            </div>
          )}
        </div>

        {/* Payment history */}
        {transactions.length > 0 && (
          <div className="mt-5 bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Payment History</p>
            <div className="space-y-2">
              {transactions.map((txn, i) => (
                <div key={i} className="flex items-center gap-3 bg-green-50 rounded-lg px-3 py-2.5 text-sm">
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
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap mt-5 justify-center">
          <button className="btn btn-secondary btn-sm" onClick={printSlip}>🖨️ Print</button>
          <button className="btn btn-primary btn-sm" onClick={downloadPDF}>📄 Download PDF</button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by {settings.propertyName || 'RentFlux'}
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, sub, value, red, green }) => (
  <tr>
    <td style={{ padding: '9px 10px', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ color: red ? '#dc2626' : green ? '#16a34a' : undefined }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
    </td>
    <td style={{ padding: '9px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right',
      fontWeight: 600, color: red ? '#dc2626' : green ? '#16a34a' : undefined }}>
      {value}
    </td>
  </tr>
);

export default SharedSlip;
