import { Route, Routes } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import ModelsPage from './pages/ModelsPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/models" element={<ModelsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default AppRoutes;
