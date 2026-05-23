import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STEPS = { FORM: 'form', OTP: 'otp' };

export default function Register() {
  const navigate = useNavigate();
  const { register, verifyOTP, resendOTP } = useAuth();

  const [step, setStep]       = useState(STEPS.FORM);
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  // OTP fields
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [countdown, setCount] = useState(0);

  const handleFormChange = (e) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const startCountdown = () => {
    setCount(60);
    const t = setInterval(() => {
      setCount(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name.trim())         return toast.error('Name is required');
    if (!form.email.trim())        return toast.error('Email is required');
    if (form.password.length < 6)  return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.toLowerCase().trim(), form.password);
      setEmail(form.email.toLowerCase().trim());
      setStep(STEPS.OTP);
      startCountdown();
      toast.success('OTP sent! Check your email.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      await verifyOTP(email, code);
      toast.success('Account verified! Welcome to RentFlux 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await resendOTP(email);
      toast.success('New OTP sent!');
      startCountdown();
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
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
          {step === STEPS.FORM ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Create account</h2>
              <p className="text-sm text-blue-200 mb-6">Enter your details to get started</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Full Name</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleFormChange}
                    placeholder="John Sharma" required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
                  <input
                    type="email" name="email" value={form.email} onChange={handleFormChange}
                    placeholder="john@example.com" required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
                  <input
                    type="password" name="password" value={form.password} onChange={handleFormChange}
                    placeholder="Min. 6 characters" required minLength={6}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Confirm Password</label>
                  <input
                    type="password" name="confirm" value={form.confirm} onChange={handleFormChange}
                    placeholder="Re-enter password" required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm mt-2"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP & Continue →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">📧</div>
                <h2 className="text-xl font-semibold text-white">Verify your email</h2>
                <p className="text-sm text-blue-200 mt-1">
                  We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                {/* OTP Boxes */}
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      className="w-11 h-12 text-center text-xl font-bold rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    />
                  ))}
                </div>

                <button
                  type="submit" disabled={loading || otp.join('').length < 6}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm"
                >
                  {loading ? 'Verifying…' : 'Verify & Create Account'}
                </button>

                <div className="text-center">
                  <button
                    type="button" onClick={handleResend} disabled={countdown > 0 || loading}
                    className="text-sm text-blue-300 hover:text-white disabled:opacity-50 transition"
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : "Didn't receive it? Resend OTP"}
                  </button>
                </div>

                <button
                  type="button" onClick={() => { setStep(STEPS.FORM); setOtp(['','','','','','']); }}
                  className="w-full text-center text-xs text-blue-400 hover:text-blue-200 transition"
                >
                  ← Back to registration
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-blue-300 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-white font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
