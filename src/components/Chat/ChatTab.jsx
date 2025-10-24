import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

function ChatTab({ messages, onSend, model }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a] text-sm text-gray-300">
        {model ? `Active Model: ${model}` : 'No model selected'}
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow messages={messages} />
      </div>
      <ChatInput onSend={onSend} />
    </div>
  );
}

export default ChatTab;