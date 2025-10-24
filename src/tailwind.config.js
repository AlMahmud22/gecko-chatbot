/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'vscode': {
          'sidebar': '#252526',
          'panel': '#1e1e1e',
          'selected': '#37373d',
          'hover': '#2a2d2e',
          'border': '#323232',
          'text': {
            primary: '#cccccc',
            secondary: '#999999',
          },
        },
        neutral: {
          750: '#323232',
          850: '#1e1e1e',
          950: '#0c0c0c',
        },
        glass: 'rgba(30, 30, 30, 0.7)',
      },
      spacing: {
        'sidebar': '64px',
        'sidebar-expanded': '240px',
      },
      maxHeight: {
        'dynamic': 'calc(100vh - 64px)',
      },
      minHeight: {
        'chat-input': '64px',
      },
      animation: {
        'glow': 'glow 1.5s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
  ],
};