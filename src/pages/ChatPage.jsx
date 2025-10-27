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
          const chatResult = await window.electronAPI.storage.chats.get(chatId);
          const chat = chatResult?.chat || chatResult;
          
          if (chat && chat.messages) {
            setMessages(chat.messages);
            setCurrentChatId(chatId);
            
            //// If the chat has a modelId and we're not already on that model's page, navigate to it
            if (chat.modelId && (!modelId || decodeURIComponent(modelId) !== chat.modelId)) {
              navigate(`/chat/${encodeURIComponent(chat.modelId)}`, { 
                replace: true, 
                state: { chatId: chatId } 
              });
            }
          }
        } catch (err) {
          console.error('Failed to load chat:', err);
        }
      } else {
        //// No chatId provided, start fresh chat
        setMessages([]);
        setCurrentChatId(null);
      }
    };
    
    loadChat();
  }, [electronApi, location.state?.chatId, modelId, navigate]);

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
        try {
          await window.electronAPI.storage.chats.appendMessage(currentChatId, userMessage);
          console.log('User message saved successfully');
        } catch (saveErr) {
          console.error('Failed to save user message:', saveErr);
          // Continue with inference even if save fails
        }
      } else {
        ////// Create new chat if this is the first message
        ////// Generate title from first 20 words of message
        const words = message.trim().split(/\s+/);
        const titleWords = words.slice(0, 20).join(' ');
        const title = titleWords.length < message.length ? titleWords + '...' : titleWords;
        
        const currentProfileId = localStorage.getItem('currentProfileId') || 'default';
        
        try {
          const newChatResult = await window.electronAPI.storage.chats.create({
            profileId: currentProfileId,
            title: title,
            modelId: selectedModel.id || selectedModel,
            messages: [userMessage]
          });
          
          if (newChatResult.success && newChatResult.chat) {
            setCurrentChatId(newChatResult.chat.id);
            console.log('New chat created successfully:', newChatResult.chat.id);
            //// Dispatch event to refresh chat history in sidebar
            window.dispatchEvent(new CustomEvent('chatUpdated', { detail: { chatId: newChatResult.chat.id } }));
          } else {
            console.error('Chat creation returned non-success result:', newChatResult);
          }
        } catch (createErr) {
          console.error('Failed to create new chat:', createErr);
          // Continue with inference even if chat creation fails
        }
      }

      ////// Run inference with the model
      ////// Pass conversation history for proper context
      const response = await window.electronAPI.runInference({
        modelId: selectedModel.id || selectedModel,
        message,
        config: { 
          generationId,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });
      
      console.log('Inference completed. Response:', {
        success: response.success,
        stopped: response.stopped,
        hasError: !!response.error,
        responseLength: response.response?.length || 0,
        textLength: response.text?.length || 0
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      //// Get response text
      const responseText = response.stopped 
        ? '[Generation stopped by user]' 
        : (response.response || response.text || '');
      
      console.log('Response text extracted:', {
        length: responseText?.length,
        preview: responseText?.substring(0, 100)
      });
      
      //// Validate response - check for error patterns and empty responses
      const isErrorResponse = responseText.includes('[Model generated an empty response') ||
                             responseText.includes('[Model generated an invalid response') ||
                             responseText.includes('[Unable to generate a valid response') ||
                             responseText.match(/^\[NEVER\]$/i) ||
                             responseText.match(/^\[ERROR\]/i) ||
                             responseText.match(/^\[FAILED\]/i);
      
      //// Only save and display if response is valid and meaningful
      if (responseText && responseText.trim().length > 0 && !isErrorResponse) {
        const botMessage = { 
          role: 'assistant', 
          content: responseText, 
          timestamp: new Date().toISOString() 
        };
        
        setMessages((prev) => [...prev, botMessage]);
        
        ////// Save assistant message to chat storage with retry logic
        if (currentChatId) {
          let saveAttempts = 0;
          const maxAttempts = 3;
          let saved = false;
          
          while (saveAttempts < maxAttempts && !saved) {
            try {
              await window.electronAPI.storage.chats.appendMessage(currentChatId, botMessage);
              console.log('Assistant message saved successfully');
              saved = true;
              
              //// Dispatch event to refresh chat history in sidebar
              window.dispatchEvent(new CustomEvent('chatUpdated', { detail: { chatId: currentChatId } }));
            } catch (saveErr) {
              saveAttempts++;
              console.error(`Failed to save assistant message (attempt ${saveAttempts}/${maxAttempts}):`, saveErr);
              
              if (saveAttempts < maxAttempts) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                // Final attempt failed - show warning but keep message in UI
                console.error('CRITICAL: Failed to persist assistant message after all retries');
                setError('Warning: Response may not be saved. Please try sending another message.');
              }
            }
          }
        }
      } else {
        console.error('Empty or invalid response received:', {
          stopped: response.stopped,
          response: response.response,
          text: response.text,
          isErrorResponse: isErrorResponse,
          fullResponse: response
        });
        setError('Model generated an empty or invalid response. Please try again or try a different model.');
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