import { useState, useEffect, useContext } from 'react';
import { ElectronApiContext } from '../../contexts/ElectronApiContext';
import useStore from '../../store';
import Button from '../Common/Button';

// Preset configurations
const PRESETS = {
  custom: {
    name: 'Custom',
    description: 'Your customized settings',
  },
  friendly: {
    name: 'Friendly',
    description: 'Warm and conversational',
    settings: {
      temperature: 0.9,
      topP: 0.95,
      repetitionPenalty: 1.1,
      presencePenalty: 0.3,
      frequencyPenalty: 0.2,
      temperatureDecay: 0.0,
      penaltyAlpha: 0.0,
      topK: 50,
      mirostat: 0.0,
    }
  },
  strict: {
    name: 'Strict',
    description: 'Precise and factual',
    settings: {
      temperature: 0.3,
      topP: 0.75,
      repetitionPenalty: 1.2,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      temperatureDecay: 0.0,
      penaltyAlpha: 0.6,
      topK: 30,
      mirostat: 0.0,
    }
  },
  creative: {
    name: 'Creative',
    description: 'Imaginative and diverse',
    settings: {
      temperature: 1.2,
      topP: 0.9,
      repetitionPenalty: 1.3,
      presencePenalty: 0.6,
      frequencyPenalty: 0.5,
      temperatureDecay: 0.1,
      penaltyAlpha: 0.2,
      topK: 70,
      mirostat: 0.0,
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Best of all worlds',
    settings: {
      temperature: 0.7,
      topP: 0.9,
      repetitionPenalty: 1.0,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      temperatureDecay: 0.0,
      penaltyAlpha: 0.0,
      topK: 40,
      mirostat: 0.0,
    }
  }
};

function SettingsChat() {
  const electronApiContext = useContext(ElectronApiContext);
  const { chatSettings, updateChatSettings } = useStore();
  const isApiReady = electronApiContext?.isApiReady || false;
  
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  const [maxTokens, setMaxTokens] = useState(chatSettings?.maxTokens || 2048);
  const [promptSize, setPromptSize] = useState(chatSettings?.promptSize || 4096);
  const [temperature, setTemperature] = useState(chatSettings?.temperature || 0.7);
  const [topP, setTopP] = useState(chatSettings?.topP || 0.9);
  const [systemPrompt, setSystemPrompt] = useState(chatSettings?.systemPrompt || '');
  const [saveHistory, setSaveHistory] = useState(chatSettings?.saveHistory ?? true);
  const [codeHighlighting, setCodeHighlighting] = useState(chatSettings?.codeHighlighting ?? true);
  const [markdownRendering, setMarkdownRendering] = useState(chatSettings?.markdownRendering ?? true);
  const [repetitionPenalty, setRepetitionPenalty] = useState(chatSettings?.repetitionPenalty || 1.0);
  const [presencePenalty, setPresencePenalty] = useState(chatSettings?.presencePenalty || 0.0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(chatSettings?.frequencyPenalty || 0.0);
  const [stop, setStop] = useState(chatSettings?.stop || '');
  const [temperatureDecay, setTemperatureDecay] = useState(chatSettings?.temperatureDecay || 0.0);
  const [penaltyAlpha, setPenaltyAlpha] = useState(chatSettings?.penaltyAlpha || 0.0);
  const [contextLength, setContextLength] = useState(chatSettings?.contextLength || 2048);
  const [batchSize, setBatchSize] = useState(chatSettings?.batchSize || 32);
  const [threads, setThreads] = useState(chatSettings?.threads || 4);
  const [topK, setTopK] = useState(chatSettings?.topK || 40);
  const [mirostat, setMirostat] = useState(chatSettings?.mirostat || 0.0);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Store original settings for change detection
  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    if (!isApiReady) return;

    const loadSettings = async () => {
      try {
        ////// Use new storage API to get chat settings section
        const result = await window.electronAPI.storage.settings.getSection('chat');
        const settings = result?.settings || result || {};
        
        const loaded = {
          maxTokens: settings.maxTokens || 2048,
          promptSize: settings.promptSize || 4096,
          temperature: settings.temperature || 0.7,
          topP: settings.topP || 0.9,
          systemPrompt: settings.systemPrompt || '',
          saveHistory: settings.saveHistory ?? true,
          codeHighlighting: settings.codeHighlighting ?? true,
          markdownRendering: settings.markdownRendering ?? true,
          repetitionPenalty: settings.repetitionPenalty || 1.0,
          presencePenalty: settings.presencePenalty || 0.0,
          frequencyPenalty: settings.frequencyPenalty || 0.0,
          stop: settings.stop || '',
          temperatureDecay: settings.temperatureDecay || 0.0,
          penaltyAlpha: settings.penaltyAlpha || 0.0,
          contextLength: settings.contextLength || 2048,
          batchSize: settings.batchSize || 32,
          threads: settings.threads || 4,
          topK: settings.topK || 40,
          mirostat: settings.mirostat || 0.0,
          preset: settings.preset || 'balanced'
        };
        
        setMaxTokens(loaded.maxTokens);
        setPromptSize(loaded.promptSize);
        setTemperature(loaded.temperature);
        setTopP(loaded.topP);
        setSystemPrompt(loaded.systemPrompt);
        setSaveHistory(loaded.saveHistory);
        setCodeHighlighting(loaded.codeHighlighting);
        setMarkdownRendering(loaded.markdownRendering);
        setRepetitionPenalty(loaded.repetitionPenalty);
        setPresencePenalty(loaded.presencePenalty);
        setFrequencyPenalty(loaded.frequencyPenalty);
        setStop(loaded.stop);
        setTemperatureDecay(loaded.temperatureDecay);
        setPenaltyAlpha(loaded.penaltyAlpha);
        setContextLength(loaded.contextLength);
        setBatchSize(loaded.batchSize);
        setThreads(loaded.threads);
        setTopK(loaded.topK);
        setMirostat(loaded.mirostat);
        setSelectedPreset(loaded.preset);
        setOriginalSettings(loaded);
      } catch (err) {
        console.error('Failed to load chat settings:', err);
        setError('Failed to load chat settings.');
      }
    };

    loadSettings();
  }, [isApiReady]);

  // Check for changes
  useEffect(() => {
    const currentSettings = {
      maxTokens, promptSize, temperature, topP, systemPrompt,
      saveHistory, codeHighlighting, markdownRendering,
      repetitionPenalty, presencePenalty, frequencyPenalty,
      stop, temperatureDecay, penaltyAlpha, contextLength,
      batchSize, threads, topK, mirostat, preset: selectedPreset
    };
    
    const changed = JSON.stringify(currentSettings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [maxTokens, promptSize, temperature, topP, systemPrompt, saveHistory,
      codeHighlighting, markdownRendering, repetitionPenalty, presencePenalty,
      frequencyPenalty, stop, temperatureDecay, penaltyAlpha, contextLength,
      batchSize, threads, topK, mirostat, selectedPreset, originalSettings]);

  // Apply preset
  const applyPreset = (presetKey) => {
    if (presetKey === 'custom') {
      setSelectedPreset('custom');
      return;
    }
    
    const preset = PRESETS[presetKey];
    if (preset && preset.settings) {
      setTemperature(preset.settings.temperature);
      setTopP(preset.settings.topP);
      setRepetitionPenalty(preset.settings.repetitionPenalty);
      setPresencePenalty(preset.settings.presencePenalty);
      setFrequencyPenalty(preset.settings.frequencyPenalty);
      setTemperatureDecay(preset.settings.temperatureDecay);
      setPenaltyAlpha(preset.settings.penaltyAlpha);
      setTopK(preset.settings.topK);
      setMirostat(preset.settings.mirostat);
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

  const handleSave = async () => {
    if (!isApiReady) {
      setError('Application not fully loaded. Please wait or restart.');
      return;
    }

    const newSettings = {
      maxTokens, promptSize, temperature, topP, systemPrompt,
      saveHistory, codeHighlighting, markdownRendering,
      repetitionPenalty, presencePenalty, frequencyPenalty,
      stop, temperatureDecay, penaltyAlpha, contextLength,
      batchSize, threads, topK, mirostat,
      preset: selectedPreset
    };

    try {
      ////// Update local store
      updateChatSettings(newSettings);
      ////// Use new storage API to update chat settings section
      await window.electronAPI.storage.settings.updateSection('chat', newSettings);
      setOriginalSettings(newSettings);
      setHasChanges(false);
      setError('');
      showToastMessage('Chat Settings Saved ✅');
    } catch (err) {
      console.error('Failed to save chat settings:', err);
      setError('Failed to save chat settings.');
    }
  };

  return (
    <div className="settings-chat space-y-8 relative">
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
          <h2 className="text-xl font-semibold text-white mb-1">Chat Settings</h2>
          <p className="text-sm text-gray-400">Configure chat behavior and appearance</p>
        </div>

        {/* Preset Selector */}
        <div className="p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
          <h3 className="text-sm font-medium text-white mb-3">Response Presets</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
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
            <h3 className="text-sm font-medium text-white">Model Parameters</h3>
            <div className="grid gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Temperature</label>
                  <span className="text-xs text-gray-500">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => handleParameterChange(setTemperature, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">1.0+ = more creative, less logical</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Top P</label>
                  <span className="text-xs text-gray-500">{topP.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={topP}
                  onChange={(e) => handleParameterChange(setTopP, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">0.8–0.95 = ideal balance between focus and diversity</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Repetition Penalty</label>
                  <span className="text-xs text-gray-500">{repetitionPenalty.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={repetitionPenalty}
                  onChange={(e) => handleParameterChange(setRepetitionPenalty, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">&gt;1.2 = strong anti-repeat; keeps output varied</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Presence Penalty</label>
                  <span className="text-xs text-gray-500">{presencePenalty.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={presencePenalty}
                  onChange={(e) => handleParameterChange(setPresencePenalty, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Higher = more topic jumps and idea shifts</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Frequency Penalty</label>
                  <span className="text-xs text-gray-500">{frequencyPenalty.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={frequencyPenalty}
                  onChange={(e) => handleParameterChange(setFrequencyPenalty, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Encourages diverse word choices</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Temperature Decay</label>
                  <span className="text-xs text-gray-500">{temperatureDecay.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperatureDecay}
                  onChange={(e) => handleParameterChange(setTemperatureDecay, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">0.1–0.3 = gentle fade, 1.0 = sharp drop</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Penalty Alpha</label>
                  <span className="text-xs text-gray-500">{penaltyAlpha.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={penaltyAlpha}
                  onChange={(e) => handleParameterChange(setPenaltyAlpha, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Low = natural, High = controlled output</p>
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
                  step="5"
                  value={topK}
                  onChange={(e) => handleParameterChange(setTopK, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Filters candidate tokens; higher = more diverse</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Mirostat</label>
                  <span className="text-xs text-gray-500">{mirostat.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={mirostat}
                  onChange={(e) => handleParameterChange(setMirostat, Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">1–2 enables adaptive sampling for steady output</p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400">Stop Sequences</label>
                <input
                  type="text"
                  value={stop}
                  onChange={(e) => setStop(e.target.value)}
                  className="w-full px-3 py-2 bg-[#252525] border border-[#3a3a3a] rounded text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Enter stop sequences (comma-separated)..."
                />
                <p className="text-xs text-gray-500">
                  Stop generation when any sequence matches
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
            <h3 className="text-sm font-medium text-white">Performance Settings</h3>
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
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
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
                  onChange={(e) => setContextLength(Number(e.target.value))}
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
                  onChange={(e) => setBatchSize(Number(e.target.value))}
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
                  onChange={(e) => setThreads(Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500">Parallel CPU threads; match with your core count</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
            <h3 className="text-sm font-medium text-white">System Prompt</h3>
            <div className="space-y-2">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-[#252525] border border-[#3a3a3a] rounded text-sm text-white font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter system prompt..."
              />
              <p className="text-xs text-gray-500">
                This prompt will be used as the system context for all conversations
              </p>
            </div>
          </div>
          <div className="space-y-4 p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
            <h3 className="text-sm font-medium text-white">Display Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={codeHighlighting}
                  onChange={(e) => setCodeHighlighting(e.target.checked)}
                  className="w-4 h-4 bg-[#252525] border-[#3a3a3a] rounded text-green-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Enable code syntax highlighting</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={markdownRendering}
                  onChange={(e) => setMarkdownRendering(e.target.checked)}
                  className="w-4 h-4 bg-[#252525] border-[#3a3a3a] rounded text-green-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Enable Markdown rendering</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={saveHistory}
                  onChange={(e) => setSaveHistory(e.target.checked)}
                  className="w-4 h-4 bg-[#252525] border-[#3a3a3a] rounded text-green-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Save chat history</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`transition-all duration-200 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Save Changes
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SettingsChat;