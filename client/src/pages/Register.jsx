import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// OTP functionality temporarily disabled for future release

export default function Register() {
  const navigate = useNavigate();
  const { register, user, loading } = useAuth();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [busy, setBusy]         = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (loading) return null;
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
      toast.success('Account created! Welcome to RentFlux');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
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
          <h2 className="text-xl font-heading font-semibold text-white mb-1">Create account</h2>
          <p className="text-sm text-indigo-200 mb-6">Enter your details to get started</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange}
                placeholder="John Sharma" required autoComplete="name"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleFormChange}
                placeholder="john@example.com" required autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleFormChange}
                  placeholder="Min. 6 characters" required minLength={6} autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                <button
                  type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Confirm Password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleFormChange}
                placeholder="Re-enter password" required autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm mt-2">
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-indigo-300 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:text-indigo-200 transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
