import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    showElectricityBreakdown: true,
    qrType: 'none',
    upiId: '', upiName: '', upiNote: '', customQrUrl: '',
    ownerName: '', ownerPhone: '', propertyName: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    settingsAPI.get()
      .then(({ data }) => setSettings(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const update = async (updates) => {
    const { data } = await settingsAPI.update(updates);
    setSettings(data.data);
    return data.data;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, update }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
