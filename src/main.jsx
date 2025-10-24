import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ElectronApiProvider } from './contexts/ElectronApiContext';
import './styles/output.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ElectronApiProvider>
      <RouterProvider router={router} />
    </ElectronApiProvider>
  </React.StrictMode>
);