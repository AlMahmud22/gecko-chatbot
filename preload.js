const { contextBridge, ipcRenderer } = require('electron');

// Safely expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  //
  // System APIs
  //
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getPaths: () => ipcRenderer.invoke('get-paths'),
  onThemeUpdated: (callback) => {
    const handler = (event, theme) => callback(theme);
    ipcRenderer.on('theme-updated', handler);
    return () => ipcRenderer.removeListener('theme-updated', handler);
  },

  //
  // Model Management APIs
  //
  getAvailableModels: (options) => ipcRenderer.invoke('get-available-models', options),
  fetchModelDetails: (modelId) => ipcRenderer.invoke('fetch-model-details', modelId),
  downloadModel: (modelId, fileName) => ipcRenderer.invoke('download-model', modelId, fileName),
  deleteModel: (modelId) => ipcRenderer.invoke('delete-model', modelId),
  getLocalModels: () => ipcRenderer.invoke('get-local-models'),
  installLocalModel: () => ipcRenderer.invoke('install-local-model'),
  openModelsFolder: () => ipcRenderer.invoke('open-models-folder'),

  //
  // Inference APIs
  //
  runInference: (args) => ipcRenderer.invoke('run-inference', args),

  //
  // Settings APIs (Local Storage)
  //
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getChatSettings: () => ipcRenderer.invoke('get-chat-settings'),
  saveChatSettings: (settings) => ipcRenderer.invoke('save-chat-settings', settings),
  getPerformanceSettings: () => ipcRenderer.invoke('get-performance-settings'),
  savePerformanceSettings: (settings) => ipcRenderer.invoke('save-performance-settings', settings),

  //
  // Chat History APIs
  //
  getChatHistory: () => ipcRenderer.invoke('get-chat-history'),
  saveChat: (chat) => ipcRenderer.invoke('save-chat', chat),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),

  //
  // Navigation APIs
  //
  navigateToChat: (modelId) => ipcRenderer.send('navigate-to-chat', modelId),
  onNavigate: (callback) => {
    const handler = (event, path) => callback(path);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },
});