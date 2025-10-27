import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatTab from '../components/Chat/ChatTab';
import Spinner from '../components/Common/Spinner';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ElectronApiContext } from '../contexts/ElectronApiContext';
import './ChatPage.css';

function ChatPage() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const electronApi = useContext(ElectronApiContext);
  const isDevelopment = electronApi?.isDevelopment || false;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  ////// Track current chat ID for persistence
  const [currentChatId, setCurrentChatId] = useState(null);
  ////// Track current generation ID for stopping
  const [currentGenerationId, setCurrentGenerationId] = useState(null);

  // Handler for when user changes model from dropdown
  const handleModelChange = (model) => {
    setSelectedModel(model);
    // Navigate to the new model's chat
    navigate(`/chat/${encodeURIComponent(model.id)}`, { replace: true });
  };

  ////// Show development mode notice
  useEffect(() => {
    if (isDevelopment) {
      console.info('Running in development mode with mock Electron API');
    }
  }, [isDevelopment, electronApi]);

  ////// Load existing chat if chatId is provided in location state
  useEffect(() => {
    const loadChat = async () => {
      if (!electronApi || !window.electronAPI) return;
      
      const chatId = location.state?.chatId;
      if (chatId) {
        try {
          const chat = await window.electronAPI.storage.chats.get(chatId);
          if (chat && chat.messages) {
            setMessages(chat.messages);
            setCurrentChatId(chatId);
          }
        } catch (err) {
          console.error('Failed to load chat:', err);
        }
      }
    };
    
    loadChat();
  }, [electronApi, location.state]);

  useEffect(() => {
    const loadModels = async () => {
      // Wait for API to be available
      if (!electronApi) {
        return;
      }

      if (!window.electronAPI) {
        setError('Application API not initialized. Please restart the app.');
        return;
      }

      try {
        ////// Get local models (already filtered to only active ones)
        const response = await window.electronAPI.getLocalModels();
        
        if (!response.success) {
          setError(response.error || 'Failed to load models');
          setAvailableModels([]);
          return;
        }
        
        const activeModels = response.models || [];
        setAvailableModels(activeModels);

        if (!modelId) {
          ////// If no model is selected, show model selection
          if (activeModels.length === 0) {
            setError('No active models available. Please activate a model in the Models page.');
            return;
          } else {
            ////// Auto-select first active model
            navigate(`/chat/${encodeURIComponent(activeModels[0].id)}`, { replace: true });
          }
        } else {
          ////// Check if selected model exists and is active
          const model = activeModels.find(m => m.id === decodeURIComponent(modelId));
          
          if (!model) {
            setError(`Selected model '${modelId}' is not active. Please activate it in the Models page.`);
            navigate('/models');
          } else {
            setSelectedModel(model);
            setError(null); // Clear any previous errors
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load available models');
      }
    };

    loadModels();
  }, [electronApi, modelId, navigate]);

  const handleStop = async () => {
    if (currentGenerationId) {
      try {
        await window.electronAPI.stopGeneration(currentGenerationId);
        setLoading(false);
        setCurrentGenerationId(null);
      } catch (err) {
        console.error('Failed to stop generation:', err);
      }
    }
  };

  const handleSend = async (message) => {
    if (!message.trim() || !selectedModel) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      ////// Generate unique ID for this generation
      const generationId = `${selectedModel.id}-${Date.now()}`;
      setCurrentGenerationId(generationId);

      ////// Save user message to chat storage
      if (currentChatId) {
        await window.electronAPI.storage.chats.appendMessage(currentChatId, userMessage);
      } else {
        ////// Create new chat if this is the first message
        const newChat = await window.electronAPI.storage.chats.create({
          profileId: 'default',
          title: message.substring(0, 50),
          modelId: selectedModel.id || selectedModel,
          messages: [userMessage]
        });
        if (newChat && newChat.id) {
          setCurrentChatId(newChat.id);
        }
      }

      ////// Run inference with the model
      const response = await window.electronAPI.runInference({
        modelId: selectedModel.id || selectedModel,
        message,
        config: { generationId }
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      ////// Handle stopped generation
      const botMessage = { 
        role: 'assistant', 
        content: response.stopped ? '[Generation stopped by user]' : (response.response || response.text || ''), 
        timestamp: new Date().toISOString() 
      };
      setMessages((prev) => [...prev, botMessage]);
      
      ////// Save assistant message to chat storage
      if (currentChatId) {
        await window.electronAPI.storage.chats.appendMessage(currentChatId, botMessage);
      }
    } catch (err) {
      console.error('Inference failed:', err);
      setError(`Failed to get response: ${err.message}`);
    } finally {
      setLoading(false);
      setCurrentGenerationId(null);
    }
  };

  if (!selectedModel && !loading) {
    return (
      <motion.div
        className="chat-page p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-semibold mb-4">Select a Model</h2>
          <p className="text-gray-400 mb-6">Please select a model from the Models page to start chatting.</p>
          <button
            onClick={() => navigate('/models')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Models
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="chat-page p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {error && (
        <motion.div
          className="error-message p-4 bg-red-900/50 text-red-200 rounded-lg mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}
      {loading && (
        <div className="flex justify-center">
          <Spinner className="w-6 h-6 text-blue-500" />
        </div>
      )}
      <ChatTab
        messages={messages}
        onSend={handleSend}
        onStop={handleStop}
        isGenerating={loading}
        model={selectedModel?.name || selectedModel?.id}
        availableModels={availableModels}
        onModelChange={handleModelChange}
      />
    </motion.div>
  );
}

export default ChatPage;