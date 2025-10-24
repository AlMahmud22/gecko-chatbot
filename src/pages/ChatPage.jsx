import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatTab from '../components/Chat/ChatTab';
import Spinner from '../components/Common/Spinner';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ElectronApiContext } from '../contexts/ElectronApiContext';
import './ChatPage.css';

function ChatPage() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { isApiReady, isDevelopment } = useContext(ElectronApiContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Show development mode notice
  useEffect(() => {
    if (isDevelopment) {
      console.info('Running in development mode with mock Electron API');
    }
  }, [isDevelopment]);

  useEffect(() => {
    const loadModels = async () => {
      if (!isApiReady) {
        setError('Electron API not available. Please check application setup.');
        return;
      }

      try {
        const models = await window.electronAPI.getAvailableModels({});
        const installedModels = models.filter(m => m.isInstalled);
        setAvailableModels(installedModels);

        if (!modelId) {
          // If no model is selected, show model selection
          if (installedModels.length === 0) {
            navigate('/models');
          } else {
            // Auto-select first installed model
            navigate(`/chat/${installedModels[0].id}`);
          }
        } else {
          // Check if selected model exists and is installed
          const model = installedModels.find(m => m.id === modelId);
          if (!model) {
            setError('Selected model is not available');
            navigate('/models');
          } else {
            setSelectedModel(model);
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load available models');
      }
    };

    loadModels();
  }, [isApiReady, modelId, navigate]);

  const handleSend = async (message) => {
    if (!message.trim() || !selectedModel) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.runInference({
        modelId: selectedModel,
        message,
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const botMessage = { role: 'bot', content: response.response, timestamp: new Date() };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Inference failed:', err);
      setError(`Failed to get response: ${err.message}`);
    } finally {
      setLoading(false);
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
        model={availableModels.find((m) => m.id === selectedModel)?.name}
      />
    </motion.div>
  );
}

export default ChatPage;