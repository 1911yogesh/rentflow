import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider }     from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute       from './components/ProtectedRoute';
import Layout        from './components/Layout';
import Login         from './pages/Login';
import Register      from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard     from './pages/Dashboard';
import Areas         from './pages/Areas';
import Houses        from './pages/Houses';
import History       from './pages/History';
import Slips         from './pages/Slips';
import Settings      from './pages/Settings';
import SharedSlip    from './pages/SharedSlip';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '10px', fontSize: '14px' },
            success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Public Rent Slip Sharing (WhatsApp links) */}
          <Route path="/share/:token" element={<SharedSlip />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/"                          element={<Dashboard />} />
              <Route path="/areas"                     element={<Areas />} />
              <Route path="/areas/:areaId/houses"      element={<Houses />} />
              <Route path="/houses"                    element={<Houses />} />
              <Route path="/history"                   element={<History />} />
              <Route path="/slips"                     element={<Slips />} />
              <Route path="/settings"                  element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  );
}
