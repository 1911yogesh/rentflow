import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  // Start loading=true ONLY if a token exists in localStorage.
  // If no token, there's nothing to validate — skip the spinner immediately.
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  // ── Persistent Login: Bootstrap on app load ─────────────────────────────────
  // Reads stored JWT from localStorage, validates with /api/auth/me
  // User stays logged in across page refreshes and new tabs (same origin = same localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // No token — nothing to restore, stay logged out
      setLoading(false);
      return;
    }

    // Token exists — attach it and validate with the server
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    authAPI.getMe()
      .then(({ data }) => {
        setUser(data.user);
      })
      .catch(() => {
        // Token invalid or expired — clear it so the user goes to login
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  }, []);

  // ── Register ────────────────────────────────────────────────────────────────
  // OTP functionality temporarily disabled for future release
  // Register now returns token and logs user in directly
  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
    }
    return data;
  }, []);

  // OTP functionality temporarily disabled for future release
  const verifyOTP = useCallback(async (email, otp) => {
    const { data } = await authAPI.verifyOTP({ email, otp });
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  }, []);

  // OTP functionality temporarily disabled for future release
  const resendOTP = useCallback(async (email) => {
    const { data } = await authAPI.resendOTP({ email });
    return data;
  }, []);

  // ── Forgot / Reset Password ─────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    const { data } = await authAPI.forgotPassword({ email });
    return data;
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await authAPI.resetPassword(token, { password });
    return data;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register,
      verifyOTP, resendOTP,
      forgotPassword, resetPassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
