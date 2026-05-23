import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authAPI } from '../services/api';

const QR_TYPES = [
  { value: 'none',   label: '🚫 No QR Code',          desc: 'Receipt without payment QR' },
  { value: 'upi',    label: '📱 UPI QR (auto-generate)', desc: 'Generate QR from your UPI ID' },
  { value: 'custom', label: '🖼️ Custom QR Image',        desc: 'Use your own QR image URL' },
];

export default function Settings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();

  const [pwForm,    setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoad]     = useState(false);
  const [settLoading, setSettLoad] = useState(false);

  // Local QR settings state (synced from context)
  const [qrForm, setQrForm] = useState({
    qrType:       settings.qrType      || 'none',
    upiId:        settings.upiId       || '',
    upiName:      settings.upiName     || '',
    upiNote:      settings.upiNote     || '',
    customQrUrl:  settings.customQrUrl || '',
    ownerName:    settings.ownerName   || '',
    ownerPhone:   settings.ownerPhone  || '',
    propertyName: settings.propertyName|| '',
  });

  // Sync qrForm when settings load
  React.useEffect(() => {
    setQrForm({
      qrType:       settings.qrType      || 'none',
      upiId:        settings.upiId       || '',
      upiName:      settings.upiName     || '',
      upiNote:      settings.upiNote     || '',
      customQrUrl:  settings.customQrUrl || '',
      ownerName:    settings.ownerName   || '',
      ownerPhone:   settings.ownerPhone  || '',
      propertyName: settings.propertyName|| '',
    });
  }, [settings]);

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6)         return toast.error('Min. 6 characters');
    setPwLoad(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setPwLoad(false); }
  };

  const toggleSetting = async (key, val) => {
    setSettLoad(true);
    try {
      await update({ [key]: val });
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSettLoad(false); }
  };

  const saveQrSettings = async () => {
    setSettLoad(true);
    try {
      await update(qrForm);
      toast.success('Payment settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSettLoad(false); }
  };

  const q = qrForm;
  const setQ = (k, v) => setQrForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage account & app preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">

        {/* Profile */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-base mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium capitalize">{v}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Email Verified</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user?.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {user?.isVerified ? '✅ Verified' : '❌ Not verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-base mb-4">Change Password</h2>
          <form onSubmit={handlePw} className="space-y-3">
            {[
              ['currentPassword', 'Current Password'],
              ['newPassword',     'New Password'],
              ['confirm',         'Confirm New Password'],
            ].map(([k, lbl]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{lbl}</label>
                <input
                  type="password" value={pwForm[k]}
                  onChange={(e) => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                  className="input" placeholder="••••••••"
                />
              </div>
            ))}
            <button type="submit" className="btn btn-primary btn-sm w-full mt-2" disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* App Preferences */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-base mb-4">Receipt Preferences</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Show Electricity Breakdown</p>
              <p className="text-xs text-gray-400">Show unit × rate calculation on receipt</p>
            </div>
            <button
              onClick={() => toggleSetting('showElectricityBreakdown', !settings.showElectricityBreakdown)}
              disabled={settLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showElectricityBreakdown ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.showElectricityBreakdown ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Receipt Branding */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-base mb-4">Receipt Branding</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Property Name (appears on receipt header)</label>
              <input value={q.propertyName} onChange={e => setQ('propertyName', e.target.value)}
                className="input" placeholder="e.g. Sharma Properties" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Owner Name</label>
              <input value={q.ownerName} onChange={e => setQ('ownerName', e.target.value)}
                className="input" placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Owner Phone</label>
              <input value={q.ownerPhone} onChange={e => setQ('ownerPhone', e.target.value)}
                className="input" placeholder="+91 98765 43210" />
            </div>
          </div>
        </div>

        {/* QR Payment Settings */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-heading font-semibold text-base mb-1">QR Payment on Receipt</h2>
          <p className="text-xs text-gray-400 mb-4">Add a payment QR code to your rent receipts so tenants can pay digitally.</p>

          {/* QR Type selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {QR_TYPES.map(({ value, label, desc }) => (
              <label key={value}
                className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition ${q.qrType === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
              >
                <input type="radio" name="qrType" value={value} checked={q.qrType === value}
                  onChange={e => setQ('qrType', e.target.value)} className="sr-only" />
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-gray-400">{desc}</span>
              </label>
            ))}
          </div>

          {/* UPI fields */}
          {q.qrType === 'upi' && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">UPI Configuration</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">UPI ID *</label>
                  <input value={q.upiId} onChange={e => setQ('upiId', e.target.value)}
                    className="input" placeholder="yourname@upi" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Account Holder Name</label>
                  <input value={q.upiName} onChange={e => setQ('upiName', e.target.value)}
                    className="input" placeholder="Full Name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Payment Note / Description</label>
                  <input value={q.upiNote} onChange={e => setQ('upiNote', e.target.value)}
                    className="input" placeholder="Rent Payment" />
                </div>
              </div>

              {/* Live QR preview */}
              {q.upiId && (
                <div className="flex items-center gap-4 pt-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${q.upiId}&pn=${q.upiName}&cu=INR&tn=${q.upiNote || 'Rent Payment'}`)}`}
                    alt="UPI QR Preview"
                    className="w-20 h-20 rounded-lg border"
                  />
                  <div>
                    <p className="text-xs font-medium text-blue-700">QR Preview</p>
                    <p className="text-xs text-gray-400 mt-0.5">This QR will appear on receipts</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom QR */}
          {q.qrType === 'custom' && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Custom QR Image</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">QR Image URL *</label>
                <input value={q.customQrUrl} onChange={e => setQ('customQrUrl', e.target.value)}
                  className="input" placeholder="https://yoursite.com/qr.png" />
                <p className="text-xs text-gray-400 mt-1">Upload your QR to any image host and paste the URL here.</p>
              </div>
              {q.customQrUrl && (
                <div className="flex items-center gap-4">
                  <img src={q.customQrUrl} alt="Custom QR" className="w-20 h-20 rounded-lg border object-contain" />
                  <p className="text-xs text-gray-400">Preview of your custom QR</p>
                </div>
              )}
            </div>
          )}

          <button onClick={saveQrSettings} className="btn btn-primary btn-sm mt-4" disabled={settLoading}>
            {settLoading ? 'Saving…' : 'Save Payment Settings'}
          </button>
        </div>

      </div>
    </div>
  );
}
