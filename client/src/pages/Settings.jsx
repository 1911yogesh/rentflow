import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const { settings, update } = useSettings();

  const [pwForm,    setPwForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoad]   = useState(false);
  const [settLoading, setSettLoad] = useState(false);

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage account & app preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">

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
              <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium capitalize">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-base mb-4">Change Password</h2>
          <form onSubmit={handlePw} className="space-y-3">
            {[
              ['Current Password', 'currentPassword', 'currentPassword'],
              ['New Password',     'newPassword',     'newPassword'],
              ['Confirm Password', 'confirm',         'confirm'],
            ].map(([label, field]) => (
              <div key={field}>
                <label className="form-label">{label}</label>
                <input type="password" value={pwForm[field]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="form-input" placeholder="••••••••" required />
              </div>
            ))}
            <button type="submit" disabled={pwLoading} className="btn btn-primary w-full justify-center mt-2">
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* App settings */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-heading font-semibold text-base mb-4">App Settings</h2>
          <div className="space-y-4">

            {/* Electricity breakdown toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-sm">Show Electricity Breakdown</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Display detailed calculation (e.g. 86 units × ₹11 = ₹946) on slips and PDFs
                </p>
              </div>
              <button
                onClick={() => toggleSetting('showElectricityBreakdown', !settings.showElectricityBreakdown)}
                disabled={settLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.showElectricityBreakdown ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings.showElectricityBreakdown ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="text-xs text-gray-400 pt-1">
              When disabled, slips show only "Prev reading → Curr reading" without unit × rate calculation.
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-heading font-semibold text-base mb-4">About RentFlux</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[['Version','v2.0.0'],['Stack','MERN'],['Database','MongoDB'],['Auth','JWT']].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{k}</p>
                <p className="font-semibold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
