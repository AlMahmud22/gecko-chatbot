import { useState, useEffect, useContext } from 'react';
import { ElectronApiContext } from '../../contexts/ElectronApiContext';
import useStore from '../../store';
import Button from '../Common/Button';

// Preset configurations for Performance
const PERFORMANCE_PRESETS = {
  custom: {
    name: 'Custom',
    description: 'Your customized settings',
  },
  speed: {
    name: 'Speed',
    description: 'Fast response time',
    settings: {
      maxTokens: 512,
      contextLength: 1024,
      batchSize: 16,
      threads: 8,
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Good speed & quality',
    settings: {
      maxTokens: 1000,
      contextLength: 2048,
      batchSize: 32,
      threads: 4,
    }
  },
  quality: {
    name: 'Quality',
    description: 'Best output quality',
    settings: {
      maxTokens: 2048,
      contextLength: 4096,
      batchSize: 64,
      threads: 2,
    }
  },
  max: {
    name: 'Max',
    description: 'Maximum capacity',
    settings: {
      maxTokens: 4096,
      contextLength: 8192,
      batchSize: 64,
      threads: 1,
    }
  }
};

function SettingsPerformance() {
  const electronApiContext = useContext(ElectronApiContext);
  const { performanceSettings, updatePerformanceSettings } = useStore();
  const isApiReady = electronApiContext?.isApiReady || false;
  
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  // Default values
  const [maxTokens, setMaxTokens] = useState(performanceSettings?.maxTokens || 1000);
  const [contextLength, setContextLength] = useState(performanceSettings?.contextLength || 2048);
  const [batchSize, setBatchSize] = useState(performanceSettings?.batchSize || 32);
  const [threads, setThreads] = useState(performanceSettings?.threads || 4);
  
  // Track original values to detect changes
  const [originalSettings, setOriginalSettings] = useState({
    maxTokens: 1000,
    contextLength: 2048,
    batchSize: 32,
    threads: 4,
    preset: 'balanced'
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!isApiReady) return;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        ////// Use new storage API to get performance settings section
        const result = await window.electronAPI.storage.settings.getSection('performance');
        const settings = result?.settings || result || {};
        
        const loadedMaxTokens = settings.maxTokens || 1000;
        const loadedContextLength = settings.contextLength || settings.contextSize || 2048;
        const loadedBatchSize = settings.batchSize || 32;
        const loadedThreads = settings.threads || 4;
        const loadedPreset = settings.preset || 'balanced';
        
        setMaxTokens(loadedMaxTokens);
        setContextLength(loadedContextLength);
        setBatchSize(loadedBatchSize);
        setThreads(loadedThreads);
        setSelectedPreset(loadedPreset);
        
        // Store original values for change detection
        setOriginalSettings({
          maxTokens: loadedMaxTokens,
          contextLength: loadedContextLength,
          batchSize: loadedBatchSize,
          threads: loadedThreads,
          preset: loadedPreset
        });
      } catch (err) {
        console.error('Failed to load performance settings:', err);
        setError('Failed to load performance settings.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isApiReady]);

  // Check if settings have changed
  const hasChanges = () => {
    return (
      maxTokens !== originalSettings.maxTokens ||
      contextLength !== originalSettings.contextLength ||
      batchSize !== originalSettings.batchSize ||
      threads !== originalSettings.threads ||
      selectedPreset !== originalSettings.preset
    );
  };

  // Apply preset
  const applyPreset = (presetKey) => {
    if (presetKey === 'custom') {
      setSelectedPreset('custom');
      return;
    }
    
    const preset = PERFORMANCE_PRESETS[presetKey];
    if (preset && preset.settings) {
      setMaxTokens(preset.settings.maxTokens);
      setContextLength(preset.settings.contextLength);
      setBatchSize(preset.settings.batchSize);
      setThreads(preset.settings.threads);
      setSelectedPreset(presetKey);
    }
  };

  // Auto-switch to Custom when manually changing parameters
  const handleParameterChange = (setter, value) => {
    setter(value);
    if (selectedPreset !== 'custom') {
      setSelectedPreset('custom');
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const validateSettings = () => {
    if (maxTokens < 1 || maxTokens > 8192) {
      setError('Max Tokens must be between 1 and 8192.');
      return false;
    }
    if (contextLength < 128 || contextLength > 32768) {
      setError('Context Length must be between 128 and 32768.');
      return false;
    }
    if (batchSize < 1 || batchSize > 512) {
      setError('Batch Size must be between 1 and 512.');
      return false;
    }
    if (threads < 1 || threads > 128) {
      setError('Threads must be between 1 and 128.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSave = async () => {
    // Clear previous messages
    setError('');
    
    if (!isApiReady) {
      setError('Application not fully loaded. Please wait or restart.');
      return;
    }
    
    if (!hasChanges()) {
      showToastMessage('No changes to save');
      return;
    }
    
    if (!validateSettings()) return;

    setIsLoading(true);
    const newSettings = {
      maxTokens,
      contextLength,
      batchSize,
      threads,
      preset: selectedPreset
    };
    
    try {
      ////// Update local store
      updatePerformanceSettings(newSettings);
      ////// Use new storage API to update performance settings section
      await window.electronAPI.storage.settings.updateSection('performance', newSettings);
      
      // Update original settings after successful save
      setOriginalSettings({
        maxTokens,
        contextLength,
        batchSize,
        threads,
        preset: selectedPreset
      });
      
      showToastMessage('Performance Settings Saved ✅');
    } catch (err) {
      console.error('Failed to save performance settings:', err);
      setError('Failed to save performance settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-performance space-y-8 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-4 py-3 bg-green-700 text-white text-sm rounded-lg shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {toastMessage}
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-900 text-red-200 text-sm rounded">
          {error}
        </div>
      )}
      
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Performance Settings</h2>
          <p className="text-sm text-gray-400">Optimize resource usage and model performance</p>
        </div>

        {/* Preset Selector */}
        <div className="p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
          <h3 className="text-sm font-medium text-white mb-3">Performance Presets</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PERFORMANCE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPreset === key
                    ? 'bg-green-700 text-white ring-2 ring-green-500 ring-offset-2 ring-offset-[#1a1a1a] shadow-lg'
                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{preset.name}</span>
                  <span className="text-xs opacity-75">{preset.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
            <h3 className="text-sm font-medium text-white">Model Performance</h3>
            <div className="grid gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Max Tokens</label>
                  <span className="text-xs text-gray-500">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="128"
                  max="4096"
                  step="128"
                  value={maxTokens}
                  onChange={(e) => handleParameterChange(setMaxTokens, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Defines token output cap per generation</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Context Length</label>
                  <span className="text-xs text-gray-500">{contextLength}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="512"
                  value={contextLength}
                  onChange={(e) => handleParameterChange(setContextLength, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Model memory window; larger = more VRAM use</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Batch Size</label>
                  <span className="text-xs text-gray-500">{batchSize}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="64"
                  step="1"
                  value={batchSize}
                  onChange={(e) => handleParameterChange(setBatchSize, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Bigger batches = faster but VRAM-intensive</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Threads</label>
                  <span className="text-xs text-gray-500">{threads}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={threads}
                  onChange={(e) => handleParameterChange(setThreads, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Parallel CPU threads; match with your core count</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isLoading || !hasChanges()}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SettingsPerformance;