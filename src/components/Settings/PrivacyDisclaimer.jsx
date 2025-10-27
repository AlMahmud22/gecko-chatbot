import React from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

function PrivacyDisclaimer() {
  return (
    <div className="bg-[#2a2a2a] border border-yellow-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ShieldExclamationIcon className="w-6 h-6 text-yellow-500 mr-3" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-yellow-500 mb-2">Privacy & Data Storage</h3>
          <p className="text-gray-300 mb-2">
            This application stores no cloud data.
          </p>
          </div>
      </div>
    </div>
  );
}

export default PrivacyDisclaimer;
