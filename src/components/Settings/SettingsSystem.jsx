import { useState, useEffect } from 'react';
import { useElectronApi } from '../../contexts/ElectronApiContext';
import Spinner from '../Common/Spinner';

// Helper function to format byte values
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || isNaN(Number(bytes))) return 'N/A';
  
  const size = Number(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = size;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
};

// Helper to get mock system info for development
const getMockSystemInfo = () => {
  return {
    cpu: { 
      brand: 'AMD Ryzen 9 5950X', 
      cores: 16,
      physicalCores: 8,
      speed: 3.4
    },
    memory: { 
      total: 32 * 1024 * 1024 * 1024, 
      free: 16 * 1024 * 1024 * 1024,
      usedPercent: 50
    },
    gpu: { 
      controllers: [
        {
          model: 'NVIDIA GeForce RTX 3080',
          vram: 10 * 1024 * 1024 * 1024
        }
      ],
      hasCuda: true
    },
    platform: 'win32',
    arch: 'x64',
    system: {
      manufacturer: 'Custom Build',
      model: 'Desktop PC'
    },
    isMock: true // Flag to indicate mock data
  };
};

// Process system info into a consistent format
const processSystemInfo = (info) => {
  if (!info) return null;
  
  // Extract GPU info
  const gpuInfo = info.gpu || {};
  const gpuControllers = gpuInfo.controllers || [];
  const primaryGpu = gpuControllers[0] || {};
  
  return {
    cpu: {
      name: info.cpu?.brand || info.cpu?.model || 'Unknown',
      cores: info.cpu?.cores || 'Unknown',
      threads: info.cpu?.physicalCores ? info.cpu.cores * 2 : info.cpu?.cores || 'Unknown',
      speed: info.cpu?.speed ? `${info.cpu.speed} GHz` : 'Unknown'
    },
    memory: {
      total: info.memory?.total || 0,
      free: info.memory?.free || info.memory?.available || 0,
      formatted: {
        total: formatBytes(info.memory?.total),
        free: formatBytes(info.memory?.free || info.memory?.available)
      }
    },
    gpu: {
      name: primaryGpu.model || gpuInfo.primaryGpu || 'None detected',
      vram: primaryGpu.vram || gpuInfo.vram || 0,
      hasCuda: gpuInfo.hasCuda || false,
      formatted: {
        vram: formatBytes(primaryGpu.vram || gpuInfo.vram)
      }
    },
    platform: info.platform || 'Unknown',
    arch: info.arch || 'Unknown',
    isMock: info.isMock || false
  };
};

function SettingsSystem() {
  const { getSystemInfo, getPaths, isDevelopment } = useElectronApi();
  const [systemInfo, setSystemInfo] = useState(null);
  const [dataPath, setDataPath] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Function to show system info alert
  const showSystemInfoAlert = (message) => {
    setAlertMessage(message);
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      setAlertMessage(null);
    }, 15000);
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId = null;
    
    console.log('Fetching system info...');
    
    const loadData = async () => {
      try {
        // Set up a 5 second timeout for system info
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.warn('System info fetch timed out after 5 seconds');
            if (isDevelopment) {
              // In dev mode, use mock data after timeout
              const mockData = getMockSystemInfo();
              setSystemInfo(processSystemInfo(mockData));
            } else {
              // In production, show error after timeout
              setSystemInfo({ 
                error: "System info timed out. Your system may not support hardware detection.",
                cpu: { name: 'Unknown', cores: '?' },
                memory: { total: 0, free: 0 },
                gpu: { name: 'Unknown' },
                platform: 'Unknown',
                arch: 'Unknown'
              });
              // Show alert for timeout in production
              showSystemInfoAlert("System information extraction timed out. Performance recommendations may be inaccurate.");
            }
            setLoading(false);
          }
        }, 5000);
        
        let sysInfo;
        if (isDevelopment) {
          console.log('Dev mode detected, trying real system info first');
          try {
            sysInfo = await getSystemInfo();
            console.log('Successfully fetched real system info in dev mode');
          } catch (devErr) {
            console.warn('Falling back to mock system info in dev mode:', devErr);
            // Provide mock data for development
            sysInfo = getMockSystemInfo();
          }
        } else {
          // Production mode - get real system info
          console.log('Production mode - fetching system info');
          sysInfo = await getSystemInfo();
          
          // Check for errors in the system info in production
          if (sysInfo.error) {
            console.error('System info extraction failed:', sysInfo.error);
            showSystemInfoAlert(`System information extraction failed: ${sysInfo.error}. Performance recommendations may be inaccurate.`);
          }
        }
        
        console.log('System info fetched successfully:', sysInfo);
        
        // Process raw system info
        const processedInfo = processSystemInfo(sysInfo);
        
        // Get paths if available
        let paths = { data: 'N/A', model: 'N/A' };
        if (getPaths) {
          try {
            paths = await getPaths();
            console.log('Paths fetched successfully:', paths);
          } catch (pathErr) {
            console.error('Failed to fetch paths:', pathErr);
          }
        }
        
        // Only update state if the component is still mounted
        if (!cancelled) {
          clearTimeout(timeoutId);
          setSystemInfo(processedInfo || { cpu: {}, memory: {} });
          setDataPath(paths?.userData || paths?.appData || 'N/A');
          setModelPath(paths?.downloads || 'N/A');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load system info:', err);
        if (!cancelled) {
          clearTimeout(timeoutId);
          setError('Failed to load system information. Please restart the application.');
          
          // In development mode, fall back to mock data
          if (isDevelopment) {
            const mockData = getMockSystemInfo();
            setSystemInfo(processSystemInfo(mockData));
          }
          
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [getSystemInfo, getPaths, isDevelopment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-semibold text-white">System Information</h2>
      
      {/* Alert message for system info extraction failures */}
      {alertMessage && !isDevelopment && (
        <div className="bg-amber-900/30 border border-amber-800/50 text-amber-300 p-3 rounded-md text-sm mb-4 animate-fadeIn">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium mb-1">System Info Warning</p>
              <p className="text-xs">{alertMessage}</p>
              <button 
                onClick={() => setAlertMessage(null)}
                className="text-xs mt-2 py-1 px-2 bg-amber-800/30 hover:bg-amber-800/50 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {systemInfo?.error ? (
        <div className="bg-red-900/30 text-red-300 p-3 rounded-md text-sm mb-4">
          {systemInfo.error}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Platform</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.platform || 'N/A'} ({systemInfo?.arch || 'N/A'})
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">CPU</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.cpu?.name || 'N/A'} 
              ({systemInfo?.cpu?.cores || 'N/A'} cores
              {systemInfo?.cpu?.threads ? `, ${systemInfo.cpu.threads} threads` : ''})
            </p>
            {systemInfo?.cpu?.speed && (
              <p className="mt-0.5 text-xs text-gray-500">
                Clock speed: {systemInfo.cpu.speed}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Memory</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.memory?.formatted?.total || 'N/A'} total, {' '}
              {systemInfo?.memory?.formatted?.free || 'N/A'} free
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">GPU</label>
            <p className="mt-1 text-gray-400">
              {systemInfo?.gpu?.name || 'N/A'}
              {systemInfo?.gpu?.formatted?.vram ? ` (${systemInfo.gpu.formatted.vram} VRAM)` : ''}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {systemInfo?.gpu?.hasCuda ? '✓ CUDA support detected' : '✗ No CUDA support detected'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Application Data</label>
            <p className="mt-1 text-gray-400 text-sm break-all">{dataPath}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Downloads Folder</label>
            <p className="mt-1 text-gray-400 text-sm break-all">{modelPath}</p>
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

export default SettingsSystem;