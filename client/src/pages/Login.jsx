import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, verifyOTP, resendOTP } = useAuth();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // State for when user needs to verify their email
  const [needsVerify, setNeedsVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [countdown, setCount]         = useState(0);

  const from = location.state?.from?.pathname || '/';

  const startCountdown = () => {
    setCount(60);
    const t = setInterval(() => {
      setCount(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.requiresVerification) {
        setVerifyEmail(err.email);
        setNeedsVerify(true);
        await resendOTP(err.email);
        startCountdown();
        toast('Please verify your email first. OTP sent!', { icon: '📧' });
      } else {
        toast.error(err?.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`login-otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`login-otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      await verifyOTP(verifyEmail, code);
      toast.success('Verified! Welcome to RentFlux 🎉');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('login-otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await resendOTP(verifyEmail);
      toast.success('New OTP sent!');
      startCountdown();
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error('Failed to resend');
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
          {!needsVerify ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
              <p className="text-sm text-blue-200 mb-6">Sign in to manage your properties</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
                  <input
                    type="email" value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com" required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
                  <input
                    type="password" value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Your password" required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm mt-2"
                >
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">📧</div>
                <h2 className="text-xl font-semibold text-white">Verify your email</h2>
                <p className="text-sm text-blue-200 mt-1">
                  Enter the code sent to <span className="text-white font-medium">{verifyEmail}</span>
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i} id={`login-otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      className="w-11 h-12 text-center text-xl font-bold rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ))}
                </div>
                <button
                  type="submit" disabled={loading || otp.join('').length < 6}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition text-sm"
                >
                  {loading ? 'Verifying…' : 'Verify Email'}
                </button>
                <div className="text-center">
                  <button
                    type="button" onClick={handleResend} disabled={countdown > 0}
                    className="text-sm text-blue-300 hover:text-white disabled:opacity-50 transition"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm text-blue-300 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-white font-medium transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
