import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * Reset Password Page
 * User arrives here from the email reset link: /reset-password/:token
 * Validates token on server; sets new password
 */
export default function ResetPassword() {
  const { token }        = useParams();
  const navigate         = useNavigate();
  const { resetPassword } = useAuth();

  const [form, setForm]     = useState({ password: '', confirm: '' });
  const [loading, setLoad]  = useState(false);
  const [showPass, setShow] = useState(false);
  const [done, setDone]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6)       return toast.error('Password must be at least 6 characters');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl mb-3 shadow-lg">🏠</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RentFlux</h1>
          <p className="text-blue-300 text-sm mt-1">Rent Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {!done ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-2xl mb-3">🔒</div>
                <h2 className="text-xl font-semibold text-white">Set new password</h2>
                <p className="text-sm text-blue-200 mt-1">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      required minLength={6} autoFocus
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                    <button type="button" onClick={() => setShow(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white text-xs transition" tabIndex={-1}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>

                  {/* Password strength hint */}
                  {form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          form.password.length >= i * 3
                            ? i <= 1 ? 'bg-red-500' : i === 2 ? 'bg-yellow-500' : i === 3 ? 'bg-blue-500' : 'bg-green-500'
                            : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm"
                >
                  {loading ? 'Resetting password…' : 'Reset Password →'}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-white mb-2">Password reset!</h2>
              <p className="text-sm text-blue-200 mb-6">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm"
              >
                Sign In →
              </button>
            </div>
          )}

          {!done && (
            <p className="text-center text-sm text-blue-300 mt-6">
              <Link to="/login" className="text-blue-400 hover:text-white transition">
                ← Back to login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
