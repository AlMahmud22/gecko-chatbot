import { useState, useEffect, useContext } from 'react';
import { ElectronApiContext } from '../../contexts/ElectronApiContext';
import useStore from '../../store';
import Button from '../Common/Button';

function SettingsChat() {
  const electronApiContext = useContext(ElectronApiContext);
  const { chatSettings, updateChatSettings } = useStore();
  const isApiReady = electronApiContext?.isApiReady || false;
  
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

  useEffect(() => {
    if (!isApiReady) return;

    const loadSettings = async () => {
      try {
        ////// Use new storage API to get chat settings section
        const result = await window.electronAPI.storage.settings.getSection('chat');
        const settings = result?.settings || result || {};
        setMaxTokens(settings.maxTokens || 2048);
        setPromptSize(settings.promptSize || 4096);
        setTemperature(settings.temperature || 0.7);
        setTopP(settings.topP || 0.9);
        setSystemPrompt(settings.systemPrompt || '');
        setSaveHistory(settings.saveHistory ?? true);
        setCodeHighlighting(settings.codeHighlighting ?? true);
        setMarkdownRendering(settings.markdownRendering ?? true);
        setRepetitionPenalty(settings.repetitionPenalty || 1.0);
        setPresencePenalty(settings.presencePenalty || 0.0);
        setFrequencyPenalty(settings.frequencyPenalty || 0.0);
        setStop(settings.stop || '');
        setTemperatureDecay(settings.temperatureDecay || 0.0);
        setPenaltyAlpha(settings.penaltyAlpha || 0.0);
        setContextLength(settings.contextLength || 2048);
        setBatchSize(settings.batchSize || 32);
        setThreads(settings.threads || 4);
        setTopK(settings.topK || 40);
        setMirostat(settings.mirostat || 0.0);
      } catch (err) {
        console.error('Failed to load chat settings:', err);
        setError('Failed to load chat settings.');
      }
    };

    loadSettings();
  }, [isApiReady]);

  const handleSave = async () => {
    if (!isApiReady) {
      setError('Application not fully loaded. Please wait or restart.');
      return;
    }

    const newSettings = {
      maxTokens,
      promptSize,
      temperature,
      topP,
      systemPrompt,
      saveHistory,
      codeHighlighting,
      markdownRendering,
      repetitionPenalty,
      presencePenalty,
      frequencyPenalty,
      stop,
      temperatureDecay,
      penaltyAlpha,
      contextLength,
      batchSize,
      threads,
      topK,
      mirostat,
    };

    try {
      ////// Update local store
      updateChatSettings(newSettings);
      ////// Use new storage API to update chat settings section
      await window.electronAPI.storage.settings.updateSection('chat', newSettings);
      setError('');
    } catch (err) {
      console.error('Failed to save chat settings:', err);
      setError('Failed to save chat settings.');
    }
  };

  return (
    <div className="settings-chat space-y-8">
      {error && (
        <div className="p-4 bg-red-900 text-red-200 text-sm">
          {error}
        </div>
      )}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Chat Settings</h2>
          <p className="text-sm text-gray-400">Configure chat behavior and appearance</p>
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
                  onChange={(e) => setTemperature(Number(e.target.value))}
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
                  onChange={(e) => setTopP(Number(e.target.value))}
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
                  onChange={(e) => setRepetitionPenalty(Number(e.target.value))}
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
                  onChange={(e) => setPresencePenalty(Number(e.target.value))}
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
                  onChange={(e) => setFrequencyPenalty(Number(e.target.value))}
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
                  onChange={(e) => setTemperatureDecay(Number(e.target.value))}
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
                  onChange={(e) => setPenaltyAlpha(Number(e.target.value))}
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
                  onChange={(e) => setTopK(Number(e.target.value))}
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
                  onChange={(e) => setMirostat(Number(e.target.value))}
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
                  className="w-full px-3 py-2 bg-[#252525] border border-[#3a3a3a] rounded text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 bg-[#252525] border border-[#3a3a3a] rounded text-sm text-white font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-4 h-4 bg-[#252525] border-[#3a3a3a] rounded text-blue-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Enable code syntax highlighting</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={markdownRendering}
                  onChange={(e) => setMarkdownRendering(e.target.checked)}
                  className="w-4 h-4 bg-[#252525] border-[#3a3a3a] rounded text-blue-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Enable Markdown rendering</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={saveHistory}
                  onChange={(e) => setSaveHistory(e.target.checked)}
                  className="w-4 h-4 bg-[#252525] border-[#3a3a3a] rounded text-blue-500 focus:ring-0 focus:ring-offset-0"
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
          >
            Save Changes
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SettingsChat;