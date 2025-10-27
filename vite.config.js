// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'development' ? '/' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    middlewareMode: false,
  },
  optimizeDeps: {
    exclude: ['electron', 'react-syntax-highlighter', 'refractor'],
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', '@heroicons/react', 'style-to-js'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [
        'electron',
        'fs',
        'path',
        'child_process',
        'systeminformation',
        'dotenv',
        'node-cache',
        /^refractor\//,
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
