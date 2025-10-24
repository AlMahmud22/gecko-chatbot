import React from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useElectronApi } from '../../contexts/ElectronApiContext';

function EnhancedLoginModal({ onClose }) {
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
      <motion.div
        className="bg-[#1a1a1a] rounded-lg p-6 max-w-lg w-full shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Sign in to Equators</h2>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Features unlock preview */}
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-500 mr-2" />
              Unlock Premium Features
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <ArrowDownTrayIcon className="w-4 h-4 text-blue-400 mr-3" />
                Download 50,000+ AI models from HuggingFace
              </div>
              <div className="flex items-center text-gray-300">
                <HeartIcon className="w-4 h-4 text-red-400 mr-3" />
                Save and organize your favorite models
              </div>
              <div className="flex items-center text-gray-300">
                <ShieldCheckIcon className="w-4 h-4 text-green-400 mr-3" />
                Higher rate limits and faster model access
              </div>
            </div>
          </div>

          {/* Login description */}
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Sign in with your Equators account to access premium model downloads and features.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Your browser will open to complete the sign-in process securely.
            </p>
          </div>

          {/* Privacy notice */}
          <div className="bg-[#1a2332] border border-blue-500/20 rounded-lg p-4 text-sm">
            <div className="flex items-start">
              <ShieldCheckIcon className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-400 font-medium mb-1">Your Privacy, Our Priority</p>
                <p className="text-gray-400">
                  • All your chats and data stay completely local on your device<br/>
                  • Sign-in is only used for model downloads and preferences<br/>
                  • No chat history or personal data is uploaded to our servers
                </p>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col space-y-3">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors"
              onClick={() => handleLogin('google')}
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
              Sign in with Google
            </button>
            
            <button
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-6 rounded-lg text-sm transition-colors"
              onClick={onClose}
            >
              Continue without signing in
            </button>
          </div>

          {/* Help text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{' '}
              <button 
                onClick={() => {
                  openExternalUrl?.('https://equators.tech/signup');
                  onClose();
                }}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Create one for free
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default EnhancedLoginModal;
