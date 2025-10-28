import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatTab from '../components/Chat/ChatTab';
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
  ////// Watchdog timer ref to prevent stuck loading state
  const loadingWatchdogRef = React.useRef(null);

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
      const isNewChatRequest = location.state?.newChat === true;
      
      // If user explicitly requested a new chat, clear everything
      if (isNewChatRequest) {
        console.log('New chat requested, clearing current chat');
        setMessages([]);
        setCurrentChatId(null);
        return;
      }
      
      // CRITICAL FIX: Don't reload chat if we already have the same chatId loaded
      // This prevents losing messages when modelId changes but chatId stays the same
      if (chatId && chatId === currentChatId && messages.length > 0) {
        console.log('Chat already loaded, skipping reload to preserve messages');
        return;
      }
      
      if (chatId) {
        try {
          const chatResult = await window.electronAPI.storage.chats.get(chatId);
          const chat = chatResult?.chat || chatResult;
          
          if (chat && chat.messages) {
            // Validate messages array contains both user and assistant messages
            const hasUser = chat.messages.some(m => m.role === 'user');
            const hasAssistant = chat.messages.some(m => m.role === 'assistant');
            
            if (chat.messages.length > 0 && !hasAssistant && hasUser) {
              console.warn('VALIDATION: Chat has user messages but no assistant responses - possible persistence issue');
            }
            
            // Ensure all messages have required fields
            const validatedMessages = chat.messages.map(msg => ({
              ...msg,
              id: msg.id || `msg-${Date.now()}-${Math.random()}`,
              role: msg.role || 'user',
              content: msg.content || '',
              model: msg.model || 'unknown',
              timestamp: msg.timestamp || new Date().toISOString()
            }));
            
            setMessages(validatedMessages);
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
      } else if (!currentChatId) {
        //// No chatId provided and no chat currently loaded, start fresh chat
        setMessages([]);
        setCurrentChatId(null);
      }
      // If chatId is null but we have currentChatId, keep the current chat (don't clear)
    };
    
    loadChat();
  }, [electronApi, location.state?.chatId, location.state?.newChat, modelId, navigate, currentChatId, messages.length]);

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
            ////// Auto-select first active model - preserve state flags
            const stateToPreserve = {};
            if (currentChatId) {
              stateToPreserve.chatId = currentChatId;
            }
            if (location.state?.newChat) {
              stateToPreserve.newChat = true;
            }
            
            navigate(`/chat/${encodeURIComponent(activeModels[0].id)}`, { 
              replace: true,
              state: Object.keys(stateToPreserve).length > 0 ? stateToPreserve : undefined
            });
          }
        } else {
          ////// Check if selected model exists and is active
          const model = activeModels.find(m => m.id === decodeURIComponent(modelId));
          
          if (!model) {
            // Model was deactivated - keep chat visible but read-only
            setError(`Selected model '${modelId}' is not active. Activate it in Models page to continue chatting.`);
            // Don't navigate away - keep the chat visible
            setSelectedModel(null);
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

  ////// Listen for model activation/deactivation events
  useEffect(() => {
    const handleModelsChanged = async (event) => {
      console.log('Models changed event received:', event.detail);
      
      // Reload models list without affecting current chat
      if (!window.electronAPI) return;
      
      try {
        const response = await window.electronAPI.getLocalModels();
        if (response.success) {
          const activeModels = response.models || [];
          setAvailableModels(activeModels);
          
          // If currently selected model was deactivated, show a warning but don't clear chat
          if (selectedModel && event.detail.action === 'deactivate' && event.detail.modelId === selectedModel.id) {
            setError('⚠️ Current model was deactivated. You can continue viewing this chat, but cannot send new messages.');
          }
          
          // If currently selected model was re-activated, clear any warnings
          if (selectedModel && event.detail.action === 'activate' && event.detail.modelId === selectedModel.id) {
            setError(null);
          }
        }
      } catch (err) {
        console.error('Failed to reload models after change:', err);
      }
    };

    window.addEventListener('modelsChanged', handleModelsChanged);
    
    return () => {
      window.removeEventListener('modelsChanged', handleModelsChanged);
    };
  }, [selectedModel]);

  const handleStop = async () => {
    if (currentGenerationId) {
      // Immediately clear UI state - don't wait for backend
      setLoading(false);
      setCurrentGenerationId(null);
      
      // Clear watchdog timer immediately
      if (loadingWatchdogRef.current) {
        clearTimeout(loadingWatchdogRef.current);
        loadingWatchdogRef.current = null;
      }
      
      // Fire stop request to backend (don't await - fire and forget)
      window.electronAPI.stopGeneration(currentGenerationId).catch(err => {
        console.error('Failed to stop generation:', err);
      });
    }
  };

  const handleSend = async (message) => {
    if (!message.trim() || !selectedModel) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    
    // Start watchdog timer: auto-clear loading if stuck for >3 minutes (for slow systems)
    loadingWatchdogRef.current = setTimeout(() => {
      console.warn('WATCHDOG: Loading state stuck for 3 minutes, but keeping it active for slow systems');
      // Don't set error or clear loading - just log it for debugging
    }, 180000); // 3 minutes for slow systems

    try {
      ////// Generate unique ID for this generation
      const generationId = `${selectedModel.id}-${Date.now()}`;
      setCurrentGenerationId(generationId);

      ////// Save user message to chat storage
      if (currentChatId) {
        try {
          const saveResult = await window.electronAPI.storage.chats.appendMessage(currentChatId, userMessage);
          console.log('User message saved successfully:', saveResult);
          
          if (!saveResult.success) {
            console.error('User message save returned non-success:', saveResult);
          }
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
      ////// Load chat and performance settings before inference
      let chatSettings = {};
      let performanceSettings = {};
      
      try {
        const chatResult = await window.electronAPI.storage.settings.getSection('chat');
        const perfResult = await window.electronAPI.storage.settings.getSection('performance');
        
        if (chatResult.success) chatSettings = chatResult.settings;
        if (perfResult.success) performanceSettings = perfResult.settings;
      } catch (settingsErr) {
        console.warn('Failed to load settings, using defaults:', settingsErr);
      }
      
      ////// Merge settings into inference config
      const inferenceConfig = {
        ...chatSettings,
        ...performanceSettings,
        generationId,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };
      
      ////// Pass conversation history for proper context
      const response = await window.electronAPI.runInference({
        modelId: selectedModel.id || selectedModel,
        message,
        config: inferenceConfig
      });
      
      // Clear watchdog immediately on response (success or error)
      if (loadingWatchdogRef.current) {
        clearTimeout(loadingWatchdogRef.current);
        loadingWatchdogRef.current = null;
      }
      
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
          model: selectedModel?.name || selectedModel?.id || 'unknown', // Attach model metadata
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
              const saveResult = await window.electronAPI.storage.chats.appendMessage(currentChatId, botMessage);
              console.log('Assistant message saved successfully:', saveResult);
              
              if (!saveResult.success) {
                throw new Error(saveResult.error || 'Save returned non-success');
              }
              
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
      // Always clear loading state and watchdog timer
      setLoading(false);
      setCurrentGenerationId(null);
      if (loadingWatchdogRef.current) {
        clearTimeout(loadingWatchdogRef.current);
        loadingWatchdogRef.current = null;
      }
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
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            Go to Models
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="chat-page h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {error && (
        <motion.div
          className="error-message p-4 bg-red-900/50 text-red-200 rounded-lg mx-6 my-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
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