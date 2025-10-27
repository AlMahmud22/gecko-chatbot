import tailwindForm from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
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
      },
      spacing: {
        'sidebar': '48px',
        'sidebar-expanded': '240px',
      },
      maxHeight: {
        'dynamic': 'calc(100vh - 64px)',
      },
      minHeight: {
        'chat-input': '64px',
      },
    },
  },
  plugins: [
    tailwindForm({ strategy: 'class' }),
  ],
};