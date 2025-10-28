import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

function ChatMessage({ role, content, model }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="message-wrapper p-6 w-full"
    >
      <div
        className={`message-bubble w-full rounded-3xl p-6 shadow-xl transition-all duration-200 ${
          role === 'user'
            ? 'bg-gradient-to-br from-green-700 to-green-800 text-white'
            : 'bg-gradient-to-br from-[#1e1e1e] to-[#252525] text-gray-100 border border-[#2a2a2a] hover:border-[#3a3a3a]'
        }`}
      >
        <div className="flex items-center mb-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
              role === 'user' 
                ? 'bg-green-900 text-white' 
                : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
            }`}
          >
            {role === 'user' ? 'Y' : 'AI'}
          </div>
          <span className={`ml-3 text-sm font-semibold ${role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
            {role === 'user' ? 'You' : 'Assistant'}
          </span>
        </div>
      <ReactMarkdown
        children={content}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative my-4">
                <button
                  onClick={() => navigator.clipboard.writeText(String(children))}
                  className="absolute top-3 right-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                >
                  Copy
                </button>
                <pre className="!bg-[#0d0d0d] !p-5 rounded-2xl border border-[#2a2a2a] overflow-x-auto shadow-inner">
                  <code className="text-gray-200 text-sm font-mono">
                    {String(children).replace(/\n$/, '')}
                  </code>
                </pre>
              </div>
            ) : (
              <code className={`${className} bg-[#2a2a2a] px-2 py-1 rounded-md text-sm font-mono`} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="text-[15px] leading-relaxed text-gray-100 mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-[15px] text-gray-100 space-y-2 my-3">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-[15px] text-gray-100 space-y-2 my-3">{children}</ol>,
          li: ({ children }) => <li className="ml-4">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} className="text-green-500 hover:text-green-400 underline transition-colors duration-200">
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-100 mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-gray-100 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold text-gray-100 mb-2">{children}</h3>,
        }}
      />
      {role === 'assistant' && model && (
        <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-[#2a2a2a]">
          <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">{model}</span>
        </div>
      )}
      </div>
    </motion.div>
  );
}

export default ChatMessage;