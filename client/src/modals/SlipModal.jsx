import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../components/UI';
import { fmtCurrency, fmtDate, monthLabel } from '../utils/helpers';

const SlipModal = ({ open, onClose, payment: p, house }) => {
  const slipRef = useRef(null);

  if (!p || !house) return null;

  const areaName = house?.area?.name || '';

  const downloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;

      const canvas = await html2canvas(slipRef.current, { scale: 2, useCORS: true });
      const img    = canvas.toDataURL('image/png');
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const w      = pdf.internal.pageSize.getWidth();
      const h      = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, w, h);
      pdf.save(`RentSlip_${house.tenantName}_${p.month}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const downloadImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(slipRef.current, { scale: 2, useCORS: true });
      const link   = document.createElement('a');
      link.download = `RentSlip_${house.tenantName}_${p.month}.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image downloaded');
    } catch {
      toast.error('Failed to generate image');
    }
  };

  const printSlip = () => {
    const content = slipRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Rent Slip</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: sans-serif; padding: 24px; }
        ${SLIP_PRINT_STYLES}
      </style></head>
      <body>${content}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    w.document.close();
  };

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
      {/* Slip content */}
      <div ref={slipRef} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', fontFamily: 'sans-serif' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb', letterSpacing: '-0.5px' }}>
            🏠 RentFlow
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Rent Payment Receipt</div>
        </div>

        <div style={{ borderTop: '2px dashed #e5e7eb', margin: '16px 0' }} />

        {/* Tenant info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            ['Tenant',       house.tenantName],
            ['House No.',    house.number],
            ['Area',         areaName],
            ['Month',        monthLabel(p.month)],
            ['Payment Date', fmtDate(p.payDate)],
            ['Phone',        house.phone],
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
            <SlipRow label="Room Rent" value={fmtCurrency(p.roomRent)} />
            <SlipRow label="Water Bill" value={fmtCurrency(p.waterBill)} />
            <SlipRow
              label={`Electricity Bill`}
              sub={`Prev: ${p.prevReading} → Curr: ${p.currReading} (${p.units} units × ₹${p.perUnit})`}
              value={fmtCurrency(p.elecBill)}
            />
            {p.prevDue > 0 && (
              <SlipRow label="Previous Due" value={fmtCurrency(p.prevDue)} red />
            )}
            {/* Total */}
            <tr style={{ background: '#eff6ff' }}>
              <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8', fontSize: '14px' }}>Total Amount</td>
              <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8', fontSize: '14px', textAlign: 'right' }}>{fmtCurrency(p.totalBill)}</td>
            </tr>
            <SlipRow label="Amount Paid" value={fmtCurrency(p.paid)} green />
            {p.remaining > 0 && (
              <SlipRow label="Balance Due" value={fmtCurrency(p.remaining)} red />
            )}
          </tbody>
        </table>

        <div style={{ borderTop: '2px dashed #e5e7eb', margin: '20px 0 16px' }} />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100px', borderBottom: '1px solid #374151', marginBottom: '4px', height: '28px' }} />
            <div style={{ fontSize: '10px', color: '#6b7280' }}>Owner Signature</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
              Generated: {new Date().toLocaleDateString('en-IN')}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '11px',
              background: p.status === 'paid' ? '#f0fdf4' : '#fffbeb',
              color:      p.status === 'paid' ? '#16a34a' : '#d97706',
              border:     `1px solid ${p.status === 'paid' ? '#bbf7d0' : '#fde68a'}`,
            }}>
              {p.status === 'paid' ? '✅ PAID' : '⏳ PARTIAL'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const SlipRow = ({ label, sub, value, red, green }) => (
  <tr>
    <td style={{ padding: '9px 10px', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ color: red ? '#dc2626' : green ? '#16a34a' : undefined }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
    </td>
    <td style={{
      padding: '9px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right',
      fontWeight: 600,
      color: red ? '#dc2626' : green ? '#16a34a' : undefined,
    }}>
      {value}
    </td>
  </tr>
);

const SLIP_PRINT_STYLES = `
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 10px; }
  th { background: #f9fafb; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; }
  td { border-bottom: 1px solid #f3f4f6; }
`;

export default SlipModal;
