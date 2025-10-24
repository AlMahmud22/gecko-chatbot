import React from 'react';
import { XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useElectronApi } from '../../contexts/ElectronApiContext';

function ProfileModal({ onClose }) {
  const { user, logout } = useAuth();
  const { openExternalUrl } = useElectronApi();
  
  const handleLogout = async () => {
    await logout();
    onClose();
  };
  
  const handleVisitAccount = () => {
    const baseUrl = window.api?.getBaseUrl?.() || 'https://equators.tech';
    openExternalUrl?.(`${baseUrl}/account`);
    onClose();
  };
  
  // Generate placeholder avatar if user doesn't have one
  const placeholderAvatar = user?.name?.[0]?.toUpperCase() || 'U';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Your Profile</h2>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center mb-6">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-16 h-16 rounded-full mr-4"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold mr-4">
              {placeholderAvatar}
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-white">{user?.name || 'User'}</h3>
            <p className="text-gray-400">{user?.email || ''}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 text-sm text-gray-400">
            <p>🔒 This application stores no cloud data, even after login. Your chats, history, and configuration are stored entirely on your device.</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
              onClick={handleVisitAccount}
            >
              <span>Manage Account on Website</span>
              <ArrowRightOnRectangleIcon className="w-4 h-4 ml-2" />
            </button>
            
            <button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
