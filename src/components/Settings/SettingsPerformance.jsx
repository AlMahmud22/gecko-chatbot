import { useState, useEffect, useContext } from 'react';
import { ElectronApiContext } from '../../contexts/ElectronApiContext';
import useStore from '../../store';
import Button from '../Common/Button';

function SettingsPerformance() {
  const { isApiReady } = useContext(ElectronApiContext);
  const { performanceSettings, updatePerformanceSettings } = useStore();
  const [threads, setThreads] = useState(performanceSettings.threads || 4);
  const [topK, setTopK] = useState(performanceSettings.top_k || 40);
  const [topP, setTopP] = useState(performanceSettings.top_p || 0.9);
  const [temperature, setTemperature] = useState(performanceSettings.temperature || 0.7);
  const [contextLength, setContextLength] = useState(performanceSettings.context_length || 2048);
  const [batchSize, setBatchSize] = useState(performanceSettings.batch_size || 32);
  const [mirostat, setMirostat] = useState(performanceSettings.mirostat || 0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isApiReady) return;

    const loadSettings = async () => {
      try {
        ////// Use new storage API to get performance settings section
        const result = await window.electronAPI.storage.settings.getSection('performance');
        const settings = result?.settings || result || {};
        setThreads(settings.threads || 4);
        setTopK(settings.top_k || 40);
        setTopP(settings.top_p || 0.9);
        setTemperature(settings.temperature || 0.7);
        setContextLength(settings.context_length || 2048);
        setBatchSize(settings.batch_size || 32);
        setMirostat(settings.mirostat || 0);
      } catch (err) {
        console.error('Failed to load performance settings:', err);
        setError('Failed to load performance settings.');
      }
    };

    loadSettings();
  }, [isApiReady]);

  const validateSettings = () => {
    if (threads < 1 || threads > 16) {
      setError('Threads must be between 1 and 16.');
      return false;
    }
    if (topK < 10 || topK > 100) {
      setError('Top K must be between 10 and 100.');
      return false;
    }
    if (topP < 0.1 || topP > 1.0) {
      setError('Top P must be between 0.1 and 1.0.');
      return false;
    }
    if (temperature < 0.1 || temperature > 2.0) {
      setError('Temperature must be between 0.1 and 2.0.');
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
    if (mirostat < 0 || mirostat > 2) {
      setError('Mirostat must be between 0 and 2.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSave = async () => {
    if (!isApiReady) {
      setError('Application not fully loaded. Please wait or restart.');
      return;
    }
    if (!validateSettings()) return;

    const newSettings = { 
      threads, 
      top_k: topK, 
      top_p: topP, 
      temperature,
      context_length: contextLength,
      batch_size: batchSize,
      mirostat
    };
    try {
      ////// Update local store
      updatePerformanceSettings(newSettings);
      ////// Use new storage API to update performance settings section
      await window.electronAPI.storage.settings.updateSection('performance', newSettings);
      setError('');
    } catch (err) {
      console.error('Failed to save performance settings:', err);
      setError('Failed to save performance settings.');
    }
  };

  return (
    <div className="p-8">
      <section>
        <h2 className="text-lg font-semibold text-white mb-1">Performance Settings</h2>
        <p className="text-sm text-gray-400 mb-4">Optimize resource usage and model performance</p>
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <div className="space-y-4 p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-400">Threads</label>
              <span className="text-xs text-gray-500">{threads}</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={threads}
              onChange={(e) => setThreads(Number(e.target.value))}
              className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-400">Top K</label>
              <span className="text-xs text-gray-500">{topK}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-400">Top P</label>
              <span className="text-xs text-gray-500">{typeof topP === 'number' ? topP.toFixed(1) : '0.9'}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={topP || 0.1}
              onChange={(e) => setTopP(Number(e.target.value))}
              className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-400">Temperature</label>
              <span className="text-xs text-gray-500">{typeof temperature === 'number' ? temperature.toFixed(1) : '0.7'}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={temperature || 0.1}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-400">Context Length</label>
              <span className="text-xs text-gray-500">{contextLength}</span>
            </div>
            <input
              type="range"
              min="128"
              max="32768"
              step="256"
              value={contextLength}
              onChange={(e) => setContextLength(Number(e.target.value))}
              className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-400">Batch Size</label>
              <span className="text-xs text-gray-500">{batchSize}</span>
            </div>
            <input
              type="range"
              min="1"
              max="512"
              step="1"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-400">Mirostat</label>
              <span className="text-xs text-gray-500">{typeof mirostat === 'number' ? mirostat.toFixed(1) : '0.0'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={mirostat}
              onChange={(e) => setMirostat(Number(e.target.value))}
              className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SettingsPerformance;