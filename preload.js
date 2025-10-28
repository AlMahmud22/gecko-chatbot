// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\preload.js

// Electron Preload Script
const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer for event listeners
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },
    removeListener: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    },
  },
});

// Safely expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // System APIs
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getPaths: () => ipcRenderer.invoke('get-paths'),
  onThemeUpdated: (callback) => {
    const handler = (event, theme) => callback(theme);
    ipcRenderer.on('theme-updated', handler);
    return () => ipcRenderer.removeListener('theme-updated', handler);
  },

  // Model Management APIs
  downloadModel: (modelId, fileName) => ipcRenderer.invoke('download-model', modelId, fileName),
  deleteModel: (modelId) => ipcRenderer.invoke('delete-model', modelId),
  getLocalModels: () => ipcRenderer.invoke('get-local-models'),
  getAvailableModels: (options) => ipcRenderer.invoke('get-available-models', options),
  fetchModelDetails: (modelId) => ipcRenderer.invoke('fetch-model-details', modelId),
  installLocalModel: () => ipcRenderer.invoke('install-local-model'),
  activateModel: (modelId) => ipcRenderer.invoke('activate-model', modelId),
  deactivateModel: (modelId) => ipcRenderer.invoke('deactivate-model', modelId),
  openModelsFolder: () => ipcRenderer.invoke('open-models-folder'),
  getModelsDirectory: () => ipcRenderer.invoke('get-models-directory'),
  changeModelsDirectory: () => ipcRenderer.invoke('change-models-directory'),
  resetModelsDirectory: () => ipcRenderer.invoke('reset-models-directory'),

  // Profile Import/Export with Dialog
  importProfile: () => ipcRenderer.invoke('import-profile'),
  exportProfile: (profileId) => ipcRenderer.invoke('export-profile', profileId),

  // Inference APIs
  loadModel: (modelId, config) => ipcRenderer.invoke('load-model', modelId, config),
  unloadModel: (modelId) => ipcRenderer.invoke('unload-model', modelId),
  getLoadedModels: () => ipcRenderer.invoke('get-loaded-models'),
  getEngineStatus: () => ipcRenderer.invoke('get-engine-status'),
  clearAllModels: () => ipcRenderer.invoke('clear-all-models'),
  runInference: (args) => ipcRenderer.invoke('run-inference', args),
  stopGeneration: (generationId) => ipcRenderer.invoke('stop-generation', { generationId }),

  // Storage APIs - Organized by category
  storage: {
    // Profile Management
    profiles: {
      getAll: () => ipcRenderer.invoke('storage:get-profiles'),
      get: (profileId) => ipcRenderer.invoke('storage:get-profile', profileId),
      create: (profileData) => ipcRenderer.invoke('storage:create-profile', profileData),
      update: (profileId, updates) => ipcRenderer.invoke('storage:update-profile', profileId, updates),
      delete: (profileId) => ipcRenderer.invoke('storage:delete-profile', profileId),
      import: (filePath) => ipcRenderer.invoke('storage:import-profile', filePath),
      export: (profileId, exportPath) => ipcRenderer.invoke('storage:export-profile', profileId, exportPath),
    },
    
    // Chat Management
    chats: {
      getAll: (profileId) => ipcRenderer.invoke('storage:get-chats', profileId),
      get: (chatId) => ipcRenderer.invoke('storage:get-chat', chatId),
      create: (chatData) => ipcRenderer.invoke('storage:create-chat', chatData),
      update: (chatId, updates) => ipcRenderer.invoke('storage:update-chat', chatId, updates),
      delete: (chatId) => ipcRenderer.invoke('storage:delete-chat', chatId),
      appendMessage: (chatId, message) => ipcRenderer.invoke('storage:append-message', chatId, message),
      updateMessage: (chatId, messageId, content) => ipcRenderer.invoke('storage:update-message', chatId, messageId, content),
      flushMessages: (chatId) => ipcRenderer.invoke('storage:flush-messages', chatId),
      deleteMessage: (chatId, messageId) => ipcRenderer.invoke('storage:delete-message', chatId, messageId),
      clearMessages: (chatId) => ipcRenderer.invoke('storage:clear-chat-messages', chatId),
      search: (query, profileId) => ipcRenderer.invoke('storage:search-chats', query, profileId),
    },
    
    // Settings Management
    settings: {
      getAll: () => ipcRenderer.invoke('storage:get-settings'),
      getSection: (section) => ipcRenderer.invoke('storage:get-settings-section', section),
      update: (settings) => ipcRenderer.invoke('storage:update-settings', settings),
      updateSection: (section, values) => ipcRenderer.invoke('storage:update-settings-section', section, values),
      reset: () => ipcRenderer.invoke('storage:reset-settings'),
      resetSection: (section) => ipcRenderer.invoke('storage:reset-settings-section', section),
      export: (exportPath) => ipcRenderer.invoke('storage:export-settings', exportPath),
      import: (importPath) => ipcRenderer.invoke('storage:import-settings', importPath),
    },
  },

  // Legacy Settings APIs (for backward compatibility)
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getChatSettings: () => ipcRenderer.invoke('get-chat-settings'),
  saveChatSettings: (settings) => ipcRenderer.invoke('save-chat-settings', settings),
  getPerformanceSettings: () => ipcRenderer.invoke('get-performance-settings'),
  savePerformanceSettings: (settings) => ipcRenderer.invoke('save-performance-settings', settings),

  // Legacy Chat History APIs (for backward compatibility)
  getChatHistory: () => ipcRenderer.invoke('get-chat-history'),
  saveChat: (chat) => ipcRenderer.invoke('save-chat', chat),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),

  // Navigation APIs
  navigateToChat: (modelId) => ipcRenderer.send('navigate-to-chat', modelId),
  onNavigate: (callback) => {
    const handler = (event, path) => callback(path);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },
});