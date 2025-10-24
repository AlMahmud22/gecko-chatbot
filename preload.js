// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Safely expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // System
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getPaths: () => ipcRenderer.invoke('get-paths'),
  onThemeUpdated: (callback) => {
    const handler = (event, theme) => callback(theme);
    ipcRenderer.on('theme-updated', handler);
    return () => ipcRenderer.removeListener('theme-updated', handler);
  },
  
  // File operations
  openFileDialog: () => ipcRenderer.invoke('dialog:open'),
  
  // Models
  getAvailableModels: (options) => ipcRenderer.invoke('get-available-models', options),
  fetchModelDetails: (modelId) => ipcRenderer.invoke('fetch-model-details', modelId),
  downloadModel: (modelId, fileName) => ipcRenderer.invoke('download-model', modelId, fileName),
  deleteModel: (modelId) => ipcRenderer.invoke('delete-model', modelId),
  getLocalModels: () => ipcRenderer.invoke('get-local-models'),
  installLocalModel: () => ipcRenderer.invoke('install-local-model'),
  openModelsFolder: () => ipcRenderer.invoke('open-models-folder'),
  navigateToChat: (modelId) => ipcRenderer.send('navigate-to-chat', modelId),

  // Inference
  runInference: (args) => ipcRenderer.invoke('run-inference', args),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Hugging Face API
  fetchHuggingFaceModels: (options) => ipcRenderer.invoke('fetch-huggingface-models', options),
  fetchHuggingFaceModelDetails: (modelId) => ipcRenderer.invoke('fetch-huggingface-model-details', modelId),
  fetchHuggingFaceModelFiles: (modelId, revision) => ipcRenderer.invoke('fetch-huggingface-model-files', modelId, revision),
  
  // Chat History
  getChatHistory: () => ipcRenderer.invoke('get-chat-history'),
  saveChat: (chat) => ipcRenderer.invoke('save-chat', chat),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),
  
  // Navigation
  onNavigate: (callback) => {
    const handler = (event, path) => callback(path);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },
  
  // Authentication - Enhanced
  getAuthToken: () => ipcRenderer.invoke('auth:get-token'),
  saveAuthToken: (token) => ipcRenderer.invoke('auth:save-token', token),
  clearAuthToken: () => ipcRenderer.invoke('auth:clear-token'),
  getHuggingFaceToken: () => ipcRenderer.invoke('auth:get-hf-token'),
  saveHuggingFaceToken: (token) => ipcRenderer.invoke('auth:save-hf-token', token),
  login: (provider = 'google', customRedirect = null) => ipcRenderer.invoke('auth:login', provider, customRedirect),
  
  // Enhanced auth methods
  getAuthStatus: () => ipcRenderer.invoke('auth:get-status'),
  getUserProfile: () => ipcRenderer.invoke('auth:get-profile'),
  refreshAuth: () => ipcRenderer.invoke('auth:refresh'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  processAuthCallback: (token) => ipcRenderer.invoke('auth:process-callback', token),
  
  // Auth token callback listener
  onAuthToken: (callback) => {
    const handler = (event, token) => callback(token);
    ipcRenderer.on('auth-token-received', handler);
    return () => ipcRenderer.removeListener('auth-token-received', handler);
  },
  
  // External URLs
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  
  // Get base URL for API calls
  getBaseUrl: () => {
    const baseUrl = process.env.BASE_URL || 'https://equators.tech';
    return baseUrl;
  },
  
  // Deep linking for auth callback
  onAuthCallback: (callback) => {
    const handler = (event, authData) => callback(authData);
    ipcRenderer.on('auth-callback', handler);
    return () => ipcRenderer.removeListener('auth-callback', handler);
  },
  
  onAuthError: (callback) => {
    const handler = (event, error) => callback(error);
    ipcRenderer.on('auth-error', handler);
    return () => ipcRenderer.removeListener('auth-error', handler);
  },
  
  // Test the protocol handler integration
  testProtocolHandler: () => {
    return ipcRenderer.invoke('test-protocol-handler');
  }
});