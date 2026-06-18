import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Reset Password Page
 * User arrives here from the email reset link: /reset-password/:token
 * Validates token on server; sets new password
 */
export default function ResetPassword() {
  const { token }          = useParams();
  const navigate           = useNavigate();
  const { resetPassword }  = useAuth();

  const [form, setForm]     = useState({ password: '', confirm: '' });
  const [loading, setLoad]  = useState(false);
  const [showPass, setShow] = useState(false);
  const [done, setDone]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6)        return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm)  return toast.error('Passwords do not match');

    setLoad(true);
    try {
      await resetPassword(token, form.password);
      setDone(true);
      toast.success('Password reset successful!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset link is invalid or has expired.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-3 shadow-lg shadow-indigo-900/30">
            <Building2 size={26} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">RentFlux</h1>
          <p className="text-indigo-300 text-sm mt-1">Rent Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {!done ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-indigo-200 mb-3">
                  <Lock size={20} />
                </div>
                <h2 className="text-xl font-heading font-semibold text-white">Set new password</h2>
                <p className="text-sm text-indigo-200 mt-1">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-100 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      required minLength={6} autoFocus autoComplete="new-password"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    />
                    <button
                      type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition p-1"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength hint */}
                  {form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          form.password.length >= i * 3
                            ? i <= 1 ? 'bg-red-500' : i === 2 ? 'bg-amber-500' : i === 3 ? 'bg-indigo-400' : 'bg-emerald-500'
                            : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-100 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                    required autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  />
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm"
                >
                  {loading ? 'Resetting password…' : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 mb-4">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-xl font-heading font-semibold text-white mb-2">Password reset!</h2>
              <p className="text-sm text-indigo-200 mb-6">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition text-sm"
              >
                Sign In
              </button>
            </div>
          )}

          {!done && (
            <p className="text-center text-sm text-indigo-300 mt-6">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white transition">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
