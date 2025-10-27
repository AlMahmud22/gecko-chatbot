import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Common/sidebar';
import { motion } from 'framer-motion';
import { useElectronApi } from './contexts/ElectronApiContext';
import { ProfileProvider } from './contexts/ProfileContext';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { onNavigate, isDevelopment } = useElectronApi();

  useEffect(() => {
    if (!onNavigate || isDevelopment) return;

    const cleanup = onNavigate((path) => {
      navigate(path);
    });

    return cleanup;
  }, [navigate, onNavigate, isDevelopment]);

  return (
    <ProfileProvider>
      <div className="app flex h-screen bg-vscode-panel">
        <Sidebar />
        <motion.div
          className="content flex-1 overflow-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </div>
    </ProfileProvider>
  );
}

export default App;