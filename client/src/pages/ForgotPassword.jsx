import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword, user, loading } = useAuth();

  const [email,   setEmail]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [sent,    setSent]    = useState(false);

  // If auth is still bootstrapping, wait
  if (loading) return null;

  // Already logged in → send to dashboard
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email address');
    setBusy(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl mb-3 shadow-lg">🏠</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RentFlux</h1>
          <p className="text-blue-300 text-sm mt-1">Rent Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-3xl mb-3">🔑</div>
                <h2 className="text-xl font-semibold text-white">Forgot your password?</h2>
                <p className="text-sm text-blue-200 mt-2">No worries — enter your email and we'll send you a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" required autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
                <button type="submit" disabled={busy}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm">
                  {busy ? 'Sending reset link…' : 'Send Reset Link →'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your inbox</h2>
              <p className="text-sm text-blue-200 mb-6 leading-relaxed">
                If <span className="text-white font-medium">{email}</span> is registered,
                you'll receive a reset link shortly. It expires in 15 minutes.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-blue-300 mb-6 text-left space-y-1">
                <p>📌 Check your spam/junk folder if you don't see it.</p>
                <p>🔒 The link is single-use and expires in 15 minutes.</p>
              </div>
              <button onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-blue-400 hover:text-white transition">
                ← Try a different email
              </button>
            </div>
          )}

          <p className="text-center text-sm text-blue-300 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-400 hover:text-white font-medium transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
