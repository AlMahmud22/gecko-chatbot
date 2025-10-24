import { createHashRouter, Navigate } from 'react-router-dom';
import App from './App';
import ChatPage from './pages/ChatPage';
import ModelsPage from './pages/ModelsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

export const router = createHashRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          index: true,
          element: <ChatPage />,
        },
        {
          path: 'models',
          element: <ModelsPage />,
        },
        {
          path: 'chat',
          element: <ChatPage />,
        },
        {
          path: 'chat/:modelId',
          element: <ChatPage />,
        },
        {
          path: 'history',
          element: <HistoryPage />,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
        },
        {
          path: '*',
          element: <Navigate to="/" />,
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    },
  }
);
