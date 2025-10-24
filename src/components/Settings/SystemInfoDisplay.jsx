import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatBytes } from './SystemUtilities';

/**
 * SystemInfoDisplay component for showing detailed system information in the settings
 */
function SystemInfoDisplay({ systemInfo, loading, error, isDevelopment }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-semibold text-white">System Information</h2>
      {systemInfo?.error ? (
        <div className="bg-red-900/30 text-red-300 p-3 rounded-md text-sm mb-4">
          <div className="flex items-start mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{systemInfo.error}</span>
          </div>
          <p className="text-xs text-red-200/70">System data extraction failed. Some features may not work optimally.</p>
          <button 
            className="mt-2 text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded hover:bg-red-800/50 transition-colors"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Platform</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.platform || 'Cannot extract system info'} ({systemInfo?.arch || 'Unknown'})
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">CPU</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.cpu?.name || 'Cannot extract system info'} 
              ({systemInfo?.cpu?.cores || 'Unknown'} cores, {systemInfo?.cpu?.threads || 'Unknown'} threads)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Memory</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.memory?.formatted?.total || 'Cannot extract system info'} total, 
              {systemInfo?.memory?.formatted?.free || 'Unknown'} free
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">GPU</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.gpu?.name || 'Cannot extract system info'}
              {systemInfo?.gpu?.formatted?.vram ? ` (${systemInfo.gpu.formatted.vram} VRAM)` : ''}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {systemInfo?.gpu?.hasCuda ? '✓ CUDA support detected' : '✗ No CUDA support detected'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Application Paths</label>
            <div className="mt-1 text-xs text-gray-500">
              <p>Downloads: {systemInfo?.paths?.downloads || 'Cannot extract path info'}</p>
              <p>User data: {systemInfo?.paths?.userData || 'Cannot extract path info'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Recommendations</label>
            <p className="mt-1 text-gray-400 text-sm">
              Maximum recommended model size: {systemInfo?.recommendations?.maxModelSize || 'Cannot determine'}
            </p>
            <p className="mt-1 text-gray-400 text-sm">
              Suggested quantization: {systemInfo?.recommendations?.suggestedQuantization || 'Cannot determine'}
            </p>
          </div>
          {isDevelopment && (
            <div className="bg-blue-900/30 p-3 rounded-md text-sm mt-4">
              <p className="text-blue-300 font-medium mb-1">Development Mode</p>
              <p className="text-gray-400">
                The application is running in development mode.
                {systemInfo?.isMock ? ' Using mock system data.' : ' Using real system data.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

SystemInfoDisplay.propTypes = {
  systemInfo: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  isDevelopment: PropTypes.bool
};

export default SystemInfoDisplay;
