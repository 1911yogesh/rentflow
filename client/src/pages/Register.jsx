import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0ede8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Home size={26} className="text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold">RentFlux</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="card px-8 py-8">
          <h2 className="font-heading font-semibold text-lg mb-6">Get started for free</h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handle}
                placeholder="John Doe" className="form-input" required />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handle}
                placeholder="admin@example.com" className="form-input" required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" name="password" value={form.password} onChange={handle}
                placeholder="Min. 6 characters" className="form-input" required />
            </div>

            <button type="submit" disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5 text-sm mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
