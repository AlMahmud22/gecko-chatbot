import React from 'react';
import { ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

function PrivacyDisclaimer() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="p-2 bg-blue-500 bg-opacity-10 rounded-lg mr-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Your Privacy Comes First</h3>
            {isAuthenticated && (
              <div className="flex items-center bg-green-500/10 px-2 py-1 rounded text-xs text-green-400">
                <LockClosedIcon className="h-3 w-3 mr-1" />
                <span>Authenticated as {user?.name || 'User'}</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Equators Chatbot stores all data <strong>locally on your device</strong>. Authentication 
            is used only to verify your account for model downloads.
          </p>
          <ul className="mt-2 text-sm text-gray-400 list-disc list-inside space-y-1">
            <li>Your chat history never leaves your device</li>
            <li>Your settings are stored locally</li>
            <li>Downloaded models remain on your device</li>
            <li>No telemetry or usage data is collected</li>
          </ul>
          <p className="mt-2 text-sm text-gray-400">
            <strong>Account login is required only for downloading models</strong> and is managed through the Equators website.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyDisclaimer;
