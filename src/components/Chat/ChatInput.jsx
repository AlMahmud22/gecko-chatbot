import { useState } from 'react'
import Button from '../Common/Button'
import { StopCircleIcon } from '@heroicons/react/24/outline'

function ChatInput({ onSend, onStop, isGenerating }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isGenerating) {
      onSend(input)
      setInput('')
    }
  }

  const handleStop = () => {
    if (onStop) {
      onStop()
    }
  }

  return (
    <div className="chat-input border-t border-[#2a2a2a] bg-[#1a1a1a]">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message Equators Chatbot..."
              className="w-full py-3 px-4 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              disabled={isGenerating}
              style={{
                minHeight: '44px',
                maxHeight: '200px',
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center space-x-1 text-xs text-gray-400">
              <span className="px-1.5 py-0.5 rounded bg-[#3a3a3a]">⏎</span>
              <span>to send</span>
            </div>
          </div>
          {isGenerating ? (
            <Button 
              onClick={handleStop}
              className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors gap-2"
            >
              <StopCircleIcon className="w-5 h-5" />
              Stop
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              Send
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default ChatInput