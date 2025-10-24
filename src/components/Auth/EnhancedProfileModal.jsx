import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useElectronApi } from '../../contexts/ElectronApiContext';

function EnhancedProfileModal({ onClose }) {
  const { user, logout } = useAuth();
  const { openExternalUrl, getUserProfile, refreshAuth } = useElectronApi();
  const [profileData, setProfileData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const profile = await getUserProfile?.();
      setProfileData(profile || user);
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setProfileData(user);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshAuth?.();
      if (result?.success) {
        await loadProfileData();
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleVisitAccount = () => {
    openExternalUrl?.('https://equators.tech/account');
    onClose();
  };

  const currentUser = profileData || user;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Your Profile</h2>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.username} 
                className="w-16 h-16 rounded-full border-2 border-gray-600"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {currentUser?.name || currentUser?.username || 'User'}
              </h3>
              {currentUser?.email && (
                <p className="text-gray-400 text-sm">{currentUser.email}</p>
              )}
              {currentUser?.subscriptionTier && (
                <div className="flex items-center mt-1">
                  <ShieldCheckIcon className="w-4 h-4 text-blue-400 mr-1" />
                  <span className="text-xs text-blue-400 capitalize">
                    {currentUser.subscriptionTier} Plan
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          {(currentUser?.hfUsername || currentUser?.subscriptionTier) && (
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-3">Account Details</h4>
              <div className="space-y-2">
                {currentUser.hfUsername && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">HuggingFace:</span>
                    <span className="text-white text-sm">@{currentUser.hfUsername}</span>
                  </div>
                )}
                {currentUser.subscriptionTier && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Plan:</span>
                    <div className="flex items-center">
                      <StarIcon className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-white text-sm capitalize">
                        {currentUser.subscriptionTier}
                      </span>
                    </div>
                  </div>
                )}
                {currentUser.lastUpdated && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Last sync:</span>
                    <span className="text-white text-sm">
                      {new Date(currentUser.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 text-sm text-gray-400">
            <div className="flex items-start">
              <ShieldCheckIcon className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-medium mb-1">Privacy First</p>
                <p>Your chats and data stay completely local. Login is only used for model downloads and cloud features.</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <button
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors"
                onClick={handleVisitAccount}
              >
                <GlobeAltIcon className="w-4 h-4 mr-2" />
                <span>Manage Account</span>
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
                title="Refresh profile data"
              >
                {isRefreshing ? (
                  <div className="w-4 h-4 border border-transparent border-t-white rounded-full animate-spin" />
                ) : (
                  '↻'
                )}
              </button>
            </div>
            
            <button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors"
              onClick={handleLogout}
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default EnhancedProfileModal;
