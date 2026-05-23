import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout    from './components/Layout';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Areas     from './pages/Areas';
import Houses    from './pages/Houses';
import History   from './pages/History';
import Slips     from './pages/Slips';
import Settings  from './pages/Settings';

const App = () => (
  <AuthProvider>
    <SettingsProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected – wrapped in Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index                      element={<Dashboard />} />
          <Route path="areas"               element={<Areas />} />
          <Route path="areas/:areaId/houses" element={<Houses />} />
          <Route path="history"             element={<History />} />
          <Route path="slips"               element={<Slips />} />
          <Route path="settings"            element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SettingsProvider>
  </AuthProvider>
);

export default App;
