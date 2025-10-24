import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function ChatMessage({ role, content }) {
  return (
    <div
      className={`message p-4 ${role === 'user' ? 'bg-[#252525]' : 'bg-[#1a1a1a]'}`}
    >
      <div className="flex items-center mb-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            role === 'user' ? 'bg-blue-600' : 'bg-green-600'
          }`}
        >
          {role === 'user' ? 'U' : 'A'}
        </div>
        <span className="ml-2 text-sm font-medium text-gray-300">
          {role === 'user' ? 'You' : 'Assistant'}
        </span>
      </div>
      <ReactMarkdown
        children={content}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative">
                <button
                  onClick={() => navigator.clipboard.writeText(String(children))}
                  className="absolute top-2 right-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 px-2 py-1 rounded text-xs"
                >
                  Copy
                </button>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="!bg-[#0c0c0c] !p-4 rounded-lg border border-[#2a2a2a]"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="text-sm text-gray-200">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-sm text-gray-200">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-gray-200">{children}</ol>,
          li: ({ children }) => <li className="ml-4">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} className="text-blue-400 hover:underline">
              {children}
            </a>
          ),
        }}
      />
    </div>
  );
}

export default ChatMessage;