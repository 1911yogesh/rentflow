import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, user, loading } = useAuth();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [busy, setBusy]         = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from?.pathname || '/';

  if (loading) return null;
  if (user) return <Navigate to={from} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-3 shadow-lg shadow-indigo-900/30">
            <Building2 size={26} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">RentFlux</h1>
          <p className="text-indigo-300 text-sm mt-1">Rent Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-heading font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-sm text-indigo-200 mb-6">Sign in to manage your properties</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Email Address</label>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com" required autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-indigo-100">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-300 hover:text-white transition font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Your password" required autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
                <button
                  type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm mt-2">
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-indigo-300 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-white font-semibold hover:text-indigo-200 transition">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
