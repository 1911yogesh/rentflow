import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Lock, Receipt, QrCode, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authAPI } from '../services/api';
import { PageHeader, FormGroup, Divider } from '../components/UI';
import { initials } from '../utils/helpers';

const QR_TYPES = [
  { value: 'none',   label: 'No QR Code',          desc: 'Receipt without payment QR' },
  { value: 'upi',    label: 'UPI QR (auto-generate)', desc: 'Generate from your UPI ID' },
  { value: 'custom', label: 'Custom QR Image',      desc: 'Paste your own QR image URL' },
];

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
      checked ? 'bg-indigo-600' : 'bg-gray-200'
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
      checked ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
);

export default function Settings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();

  const [pwForm,      setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading,   setPwLoading]  = useState(false);
  const [settLoading, setSettLoading] = useState(false);

  const [qrForm, setQrForm] = useState({
    qrType:       settings.qrType       || 'none',
    upiId:        settings.upiId        || '',
    upiName:      settings.upiName      || '',
    upiNote:      settings.upiNote      || '',
    customQrUrl:  settings.customQrUrl  || '',
    ownerName:    settings.ownerName    || '',
    ownerPhone:   settings.ownerPhone   || '',
    propertyName: settings.propertyName || '',
  });

  React.useEffect(() => {
    setQrForm({
      qrType:       settings.qrType       || 'none',
      upiId:        settings.upiId        || '',
      upiName:      settings.upiName      || '',
      upiNote:      settings.upiNote      || '',
      customQrUrl:  settings.customQrUrl  || '',
      ownerName:    settings.ownerName    || '',
      ownerPhone:   settings.ownerPhone   || '',
      propertyName: settings.propertyName || '',
    });
  }, [settings]);

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Minimum 6 characters required');
    setPwLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally { setPwLoading(false); }
  };

  const toggleSetting = async (key, val) => {
    setSettLoading(true);
    try {
      await update({ [key]: val });
      toast.success('Setting saved');
    } catch { toast.error('Failed to save setting'); }
    finally { setSettLoading(false); }
  };

  const saveQrSettings = async () => {
    setSettLoading(true);
    try {
      await update(qrForm);
      toast.success('Payment settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSettLoading(false); }
  };

  const setQ = (k, v) => setQrForm(p => ({ ...p, [k]: v }));
  const q = qrForm;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and app preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">

        {/* ── Profile ────────────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-indigo-600" />
            <h2 className="font-heading font-bold text-sm text-gray-700 uppercase tracking-wide">Profile</h2>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg font-heading shrink-0">
              {initials(user?.name)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-0 divide-y divide-gray-100 text-sm">
            {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-900 capitalize">{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2.5">
              <span className="text-gray-400">Email Verified</span>
              {user?.isVerified ? (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                  <CheckCircle2 size={14} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500 font-semibold text-xs">
                  <XCircle size={14} /> Not verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-indigo-600" />
            <h2 className="font-heading font-bold text-sm text-gray-700 uppercase tracking-wide">Change Password</h2>
          </div>

          <form onSubmit={handlePw} className="space-y-3">
            {[
              ['currentPassword', 'Current Password'],
              ['newPassword',     'New Password'],
              ['confirm',         'Confirm New Password'],
            ].map(([k, lbl]) => (
              <FormGroup key={k} label={lbl}>
                <input
                  type="password"
                  value={pwForm[k]}
                  onChange={(e) => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                  className="form-input"
                  placeholder="••••••••"
                  autoComplete="off"
                />
              </FormGroup>
            ))}
            <button
              type="submit"
              className="btn btn-primary w-full justify-center mt-1"
              disabled={pwLoading}
            >
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── Receipt Branding ────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={16} className="text-indigo-600" />
            <h2 className="font-heading font-bold text-sm text-gray-700 uppercase tracking-wide">Receipt Branding</h2>
          </div>

          <div className="space-y-3">
            <FormGroup label="Property Name">
              <input
                value={q.propertyName}
                onChange={e => setQ('propertyName', e.target.value)}
                className="form-input"
                placeholder="e.g. Sharma Properties"
              />
            </FormGroup>
            <FormGroup label="Owner Name">
              <input
                value={q.ownerName}
                onChange={e => setQ('ownerName', e.target.value)}
                className="form-input"
                placeholder="Full name"
              />
            </FormGroup>
            <FormGroup label="Owner Phone">
              <input
                value={q.ownerPhone}
                onChange={e => setQ('ownerPhone', e.target.value)}
                className="form-input"
                placeholder="+91 98765 43210"
              />
            </FormGroup>
          </div>
        </div>

        {/* ── Receipt Preferences ─────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Receipt size={16} className="text-indigo-600" />
            <h2 className="font-heading font-bold text-sm text-gray-700 uppercase tracking-wide">Receipt Preferences</h2>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-medium text-gray-800">Show Electricity Breakdown</p>
              <p className="text-xs text-gray-400 mt-0.5">Show unit × rate calculation on receipt</p>
            </div>
            <Toggle
              checked={!!settings.showElectricityBreakdown}
              onChange={(val) => toggleSetting('showElectricityBreakdown', val)}
              disabled={settLoading}
            />
          </div>
        </div>

        {/* ── QR Payment Settings ─────────────────────────────────────────── */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={16} className="text-indigo-600" />
            <h2 className="font-heading font-bold text-sm text-gray-700 uppercase tracking-wide">QR Payment on Receipt</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Add a payment QR code to rent receipts so tenants can pay digitally.
          </p>

          {/* QR type picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {QR_TYPES.map(({ value, label, desc }) => (
              <label
                key={value}
                className={`flex flex-col gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  q.qrType === value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio" name="qrType" value={value}
                  checked={q.qrType === value}
                  onChange={e => setQ('qrType', e.target.value)}
                  className="sr-only"
                />
                <span className={`text-sm font-semibold ${q.qrType === value ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {label}
                </span>
                <span className="text-xs text-gray-400">{desc}</span>
              </label>
            ))}
          </div>

          {/* UPI fields */}
          {q.qrType === 'upi' && (
            <div className="bg-indigo-50 rounded-2xl p-5 space-y-4">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest">UPI Configuration</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormGroup label="UPI ID *">
                  <input
                    value={q.upiId}
                    onChange={e => setQ('upiId', e.target.value)}
                    className="form-input"
                    placeholder="yourname@upi"
                  />
                </FormGroup>
                <FormGroup label="Account Holder Name">
                  <input
                    value={q.upiName}
                    onChange={e => setQ('upiName', e.target.value)}
                    className="form-input"
                    placeholder="Full Name"
                  />
                </FormGroup>
                <FormGroup label="Payment Note" className="sm:col-span-2">
                  <input
                    value={q.upiNote}
                    onChange={e => setQ('upiNote', e.target.value)}
                    className="form-input"
                    placeholder="Rent Payment"
                  />
                </FormGroup>
              </div>

              {q.upiId && (
                <>
                  <Divider label="Preview" />
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        `upi://pay?pa=${q.upiId}&pn=${q.upiName}&cu=INR&tn=${q.upiNote || 'Rent Payment'}`
                      )}`}
                      alt="UPI QR Preview"
                      className="w-20 h-20 rounded-xl border border-indigo-200"
                    />
                    <div>
                      <p className="text-xs font-semibold text-indigo-700">QR Preview</p>
                      <p className="text-xs text-gray-400 mt-0.5">This QR will appear on rent receipts</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Custom QR */}
          {q.qrType === 'custom' && (
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Custom QR Image</p>
              <FormGroup label="QR Image URL *" hint="Upload your QR to any image host and paste the direct URL here.">
                <input
                  value={q.customQrUrl}
                  onChange={e => setQ('customQrUrl', e.target.value)}
                  className="form-input"
                  placeholder="https://yoursite.com/qr.png"
                />
              </FormGroup>
              {q.customQrUrl && (
                <div className="flex items-center gap-4">
                  <img
                    src={q.customQrUrl}
                    alt="Custom QR Preview"
                    className="w-20 h-20 rounded-xl border object-contain bg-white"
                  />
                  <p className="text-xs text-gray-400">Preview of your custom QR</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={saveQrSettings}
            className="btn btn-primary mt-5"
            disabled={settLoading}
          >
            {settLoading ? 'Saving…' : 'Save Payment Settings'}
          </button>
        </div>

      </div>
    </div>
  );
}
