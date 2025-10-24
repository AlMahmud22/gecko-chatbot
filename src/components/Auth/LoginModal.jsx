import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useElectronApi } from '../../contexts/ElectronApiContext';

function LoginModal({ onClose }) {
  const { login } = useElectronApi();
  
  const handleLogin = async (provider = 'google') => {
    // 🔧 ENHANCED: Use enhanced login method with proper OAuth flow
    try {
      const result = await login?.(provider);
      if (result?.success) {
        console.log('Login initiated successfully');
      } else {
        console.error('Failed to initiate login:', result?.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Login Required</h2>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-300">
            Login is required to download models from Hugging Face. Visit the Equators Chatbot website to create an account or log in.
          </p>
          
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 text-sm text-gray-400">
            <p className="mb-2">💡 <span className="text-blue-400">Important:</span></p>
            <p>This application stores no cloud data, even after login. Login is required only to download models. Your chats, history, and configuration are stored entirely on your device.</p>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              onClick={() => handleLogin('google')}
            >
              Login with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
