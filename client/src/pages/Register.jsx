import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// OTP functionality temporarily disabled for future release

export default function Register() {
  const navigate      = useNavigate();
  const { register, user, loading } = useAuth();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [busy, setBusy]         = useState(false);
  const [showPass, setShowPass] = useState(false);

  // If auth is still bootstrapping, wait
  if (loading) return null;

  // Already logged in → send to dashboard
  if (user) return <Navigate to="/" replace />;

  const handleFormChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name.trim())              return toast.error('Name is required');
    if (!form.email.trim())             return toast.error('Email is required');
    if (form.password.length < 6)       return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setBusy(true);
    try {
      await register(form.name.trim(), form.email.toLowerCase().trim(), form.password);
      toast.success('Account created! Welcome to RentFlux 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
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
          <h2 className="text-xl font-semibold text-white mb-1">Create account</h2>
          <p className="text-sm text-blue-200 mb-6">Enter your details to get started</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange}
                placeholder="John Sharma" required
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleFormChange}
                placeholder="john@example.com" required
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleFormChange}
                  placeholder="Min. 6 characters" required minLength={6}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white text-xs transition" tabIndex={-1}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Confirm Password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleFormChange}
                placeholder="Re-enter password" required
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm mt-2">
              {busy ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-blue-300 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-white font-medium transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
