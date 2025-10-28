import { useState, useRef, useEffect } from 'react'
import Button from '../Common/Button'
import { StopCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

function ChatInput({ onSend, onStop, isGenerating }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea based on content - ChatGPT style
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to single line to properly measure scrollHeight
      textarea.style.height = '52px'
      
      // If textarea is empty, keep it at minimum height
      if (input.trim() === '') {
        textarea.style.height = '52px'
        textarea.style.overflowY = 'hidden'
        return
      }
      
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 200 // Max height for about 5 rows
      
      // Expand up to max height, then enable scroll
      if (scrollHeight <= maxHeight) {
        textarea.style.height = `${scrollHeight}px`
        textarea.style.overflowY = 'hidden'
      } else {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = 'auto'
      }
    }
  }, [input])

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

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  return (
    <div className="chat-input-wrapper border-t border-[#2a2a2a]">
      <form onSubmit={handleSubmit} className="max-w-full mx-auto py-6 px-[10%]">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message Gecko Chatbot..."
              className="w-full py-3 pl-4 pr-3 bg-[#1e1e1e] text-white rounded-3xl border-2 border-[#2a2a2a] focus:outline-none focus:border-green-500 resize-none transition-all duration-200 shadow-lg hover:shadow-xl hover:border-[#3a3a3a] custom-scrollbar"
              disabled={isGenerating}
              style={{
                minHeight: '52px',
                maxHeight: '200px',
              }}
            />
          </div>
          
          {/* Button container - stays at bottom */}
          <div className="flex items-center gap-2 pb-1">
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStop}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center transition-all duration-200 gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <StopCircleIcon className="w-5 h-5" />
                <span className="font-medium">Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg ${
                  input.trim()
                    ? 'bg-green-700 hover:bg-green-800 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-[#2a2a2a] cursor-not-allowed opacity-50'
                }`}
              >
                <PaperAirplaneIcon className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
        
        {/* Hint text */}
        <div className="mt-2 text-xs text-gray-500 pl-1">
          <span className="px-2 py-1 rounded-md bg-[#1a1a1a] border border-[#2a2a2a]">Shift + Enter</span>
          <span className="ml-2">for new line</span>
        </div>
      </form>
    </div>
  )
}

export default ChatInput