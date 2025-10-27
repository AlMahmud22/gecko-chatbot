import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

function ChatTab({ messages, onSend, onStop, isGenerating, model, availableModels, onModelChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelSelect = (selectedModel) => {
    onModelChange(selectedModel);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a] text-sm text-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Active Model:</span>
          {availableModels && availableModels.length > 0 ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333333] rounded-md transition-colors"
              >
                <span className="font-medium text-blue-400">
                  {model || 'Select a model'}
                </span>
                <ChevronDownIcon 
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 max-h-64 overflow-y-auto bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-50">
                  {availableModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleModelSelect(m)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-[#333333] transition-colors border-b border-[#333333] last:border-b-0 ${
                        model === (m.name || m.id) ? 'bg-[#333333] text-blue-400' : 'text-gray-300'
                      }`}
                    >
                      <div className="font-medium">{m.name || m.id}</div>
                      {m.sizeFormatted && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {m.sizeFormatted}
                          {m.isExternal && <span className="ml-2 text-orange-400">(External)</span>}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">{model || 'No model selected'}</span>
          )}
        </div>
        {availableModels && (
          <span className="text-xs text-gray-500">
            {availableModels.length} model{availableModels.length !== 1 ? 's' : ''} active
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow messages={messages} />
      </div>
      <ChatInput onSend={onSend} onStop={onStop} isGenerating={isGenerating} />
    </div>
  );
}

export default ChatTab;