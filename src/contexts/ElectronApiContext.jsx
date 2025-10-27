import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockElectronApi } from '../utils/mockElectronApi';

// Create context with a default value of undefined
export const ElectronApiContext = createContext(undefined);

// Custom hook to use the Electron API context
export const useElectronApi = () => {
  const context = useContext(ElectronApiContext);
  if (context === undefined) {
    throw new Error('useElectronApi must be used within an ElectronApiProvider');
  }
  return context;
};

export const ElectronApiProvider = ({ children }) => {
  const [api, setApi] = useState(() => window.electronAPI || mockElectronApi);
  const [isApiReady, setIsApiReady] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    if (isDevelopment) {
      // In development, API is ready immediately
      setIsApiReady(true);
    } else {
      // In production, check for the real Electron API
      const checkApiAvailability = () => {
        if (window.electronAPI) {
          setApi(window.electronAPI);
          setIsApiReady(true);
        } else {
          // Retry after a short delay
          setTimeout(checkApiAvailability, 100);
        }
      };
      checkApiAvailability();
    }
  }, [isDevelopment]);

  const contextValue = {
    ...api,
    isDevelopment,
    isMockApi: api === mockElectronApi,
    isApiReady
  };

  return (
    <ElectronApiContext.Provider value={contextValue}>
      {children}
    </ElectronApiContext.Provider>
  );
};