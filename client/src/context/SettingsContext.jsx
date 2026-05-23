import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({ showElectricityBreakdown: true });
  const [loaded, setLoaded]     = useState(false);

  const load = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.data);
    } catch { /* user may not be logged in yet */ }
    setLoaded(true);
  };

  useEffect(() => { load(); }, []);

  const update = async (updates) => {
    const res = await settingsAPI.update(updates);
    setSettings(res.data.data);
    return res.data.data;
  };

  return (
    <SettingsContext.Provider value={{ settings, update, reload: load, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
