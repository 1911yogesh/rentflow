import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoad]  = useState(false);

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6)         return toast.error('New password must be at least 6 characters');
    setPwLoad(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setPwLoad(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
        {/* Profile info */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-base mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="badge badge-blue text-[10px] mt-1">{user?.role}</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-base mb-4">Change Password</h2>
          <form onSubmit={handlePw} className="space-y-3">
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password" value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="form-input" placeholder="••••••••" required
              />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password" value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="form-input" placeholder="Min. 6 characters" required
              />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password" value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                className="form-input" placeholder="Repeat new password" required
              />
            </div>
            <button type="submit" disabled={pwLoading} className="btn btn-primary w-full justify-center mt-2">
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* App info */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-heading font-semibold text-base mb-4">About RentFlow</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              ['Version',   'v1.0.0'],
              ['Stack',     'MERN'],
              ['Database',  'MongoDB Atlas'],
              ['Auth',      'JWT'],
            ].map(([k, v]) => (
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
