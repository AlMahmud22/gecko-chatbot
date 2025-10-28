import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';
import { useEffect, useRef } from 'react';

const ChatWindow = ({ messages, isGenerating }) => {
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages change or when generating
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages && messages.length > 0 ? (
          <div className="divide-y divide-[#2a2a2a]">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id || `${msg.role}-${msg.timestamp}`}
                role={msg.role}
                content={msg.content}
                model={msg.model}
                timestamp={msg.timestamp}
              />
            ))}
            {isGenerating && <ThinkingIndicator />}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 rounded-lg">
              <div className="flex justify-center mb-4">
                <img 
                  src="./gecko.png" 
                  alt="Gecko" 
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Welcome to Gecko Chatbot</h2>
              <p className="text-gray-400">
                Start a conversation with your local AI assistant
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
