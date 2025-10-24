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
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isApiReady) return;

    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getChatSettings();
        setMaxTokens(settings.maxTokens);
        setPromptSize(settings.promptSize);
        setTemperature(settings.temperature);
        setTopP(settings.topP);
        setSystemPrompt(settings.systemPrompt);
        setSaveHistory(settings.saveHistory);
        setCodeHighlighting(settings.codeHighlighting);
        setMarkdownRendering(settings.markdownRendering);
      } catch (err) {
        console.error('Failed to load chat settings:', err);
        setError('Failed to load chat settings.');
      }
    };

    loadSettings();
  }, [isApiReady]);

  const handleSave = () => {
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
    };

    try {
      updateChatSettings(newSettings);
      window.electronAPI.setChatSettings(newSettings);
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
                  <label className="block text-xs font-medium text-gray-400">Max Tokens</label>
                  <span className="text-xs text-gray-500">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="128"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Temperature</label>
                  <span className="text-xs text-gray-500">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-400">Top P</label>
                  <span className="text-xs text-gray-500">{topP.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(Number(e.target.value))}
                  className="w-full bg-[#2a2a2a] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
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