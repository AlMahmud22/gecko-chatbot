import ChatMessage from './ChatMessage';

const ChatWindow = ({ messages }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages && messages.length > 0 ? (
          <div className="divide-y divide-[#2a2a2a]">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 rounded-lg">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-xl font-semibold text-white mb-2">Welcome to Equators Chat</h2>
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
