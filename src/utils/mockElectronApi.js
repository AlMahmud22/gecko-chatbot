/**
 * Mock Electron API for development mode
 * Provides stub implementations of Electron IPC calls
 */

export const mockElectronApi = {
  ////// System APIs
  getSystemInfo: async () => {
    console.warn('Mock: getSystemInfo');
    return {
      cpu: { name: 'Mock CPU', cores: 8, threads: 16, speed: '3.6 GHz' },
      memory: { total: 16000000000, free: 8000000000, formatted: { total: '16 GB', free: '8 GB' } },
      gpu: { name: 'Mock GPU', hasCuda: false, formatted: { vram: '4 GB' } },
      platform: 'win32',
      arch: 'x64',
      isMock: true
    };
  },

  getPaths: async () => {
    console.warn('Mock: getPaths');
    return {
      appData: '/mock/appData',
      userData: '/mock/userData',
      temp: '/mock/temp',
      downloads: '/mock/downloads',
      documents: '/mock/documents'
    };
  },

  onThemeUpdated: (callback) => {
    console.warn('Mock: onThemeUpdated');
    return () => {};
  },

  ////// Model Management APIs
  getLocalModels: async () => {
    console.warn('Mock: getLocalModels - returning mock models');
    return {
      success: true,
      models: [
        {
          id: 'mock-model-1.gguf',
          name: 'mock-model-1.gguf',
          size: 4500000000,
          sizeFormatted: '4.5 GB',
          modified: new Date().toISOString(),
          active: true,
        },
        {
          id: 'mock-model-2.gguf',
          name: 'mock-model-2.gguf',
          size: 7800000000,
          sizeFormatted: '7.8 GB',
          modified: new Date().toISOString(),
          active: true,
        }
      ],
      count: 2
    };
  },

  getAvailableModels: async (options) => {
    console.warn('Mock: getAvailableModels - returning mock models');
    return { 
      success: true,
      models: [
        {
          id: 'mock-model-1.gguf',
          name: 'mock-model-1.gguf',
          size: 4500000000,
          sizeFormatted: '4.5 GB',
          modified: new Date().toISOString(),
          registryInfo: {
            active: true,
            isExternal: false
          }
        },
        {
          id: 'mock-model-2.gguf',
          name: 'mock-model-2.gguf',
          size: 7800000000,
          sizeFormatted: '7.8 GB',
          modified: new Date().toISOString(),
          registryInfo: {
            active: true,
            isExternal: false
          }
        },
        {
          id: 'mock-model-3.gguf',
          name: 'mock-model-3.gguf',
          size: 3200000000,
          sizeFormatted: '3.2 GB',
          modified: new Date().toISOString(),
          registryInfo: {
            active: false,
            isExternal: false
          }
        }
      ],
      count: 3,
      nextUrl: null 
    };
  },

  fetchModelDetails: async (modelId) => {
    console.warn(`Mock: fetchModelDetails - ${modelId}`);
    return { id: modelId, name: 'Mock Model', description: 'Mock description' };
  },

  downloadModel: async (modelId, fileName) => {
    console.warn(`Mock: downloadModel - ${modelId} (${fileName})`);
    return { success: true, modelId };
  },

  deleteModel: async (modelId) => {
    console.warn(`Mock: deleteModel - ${modelId}`);
    return { success: true };
  },

  installLocalModel: async () => {
    console.warn('Mock: installLocalModel');
    return { success: false, message: 'Not available in mock mode' };
  },

  activateModel: async (modelId) => {
    console.warn(`Mock: activateModel - ${modelId}`);
    return { success: true };
  },

  deactivateModel: async (modelId) => {
    console.warn(`Mock: deactivateModel - ${modelId}`);
    return { success: true };
  },

  openModelsFolder: async () => {
    console.warn('Mock: openModelsFolder');
    return { success: false };
  },

  ////// Inference APIs
  loadModel: async (modelId, config) => {
    console.warn(`Mock: loadModel - ${modelId}`);
    return { success: true };
  },

  unloadModel: async (modelId) => {
    console.warn(`Mock: unloadModel - ${modelId}`);
    return { success: true };
  },

  getLoadedModels: async () => {
    console.warn('Mock: getLoadedModels');
    return [];
  },

  getEngineStatus: async () => {
    console.warn('Mock: getEngineStatus');
    return { engine: 'mock', loaded: [], status: 'ready' };
  },

  clearAllModels: async () => {
    console.warn('Mock: clearAllModels');
    return { success: true };
  },

  runInference: async ({ modelId, message, config }) => {
    console.warn(`Mock: runInference - ${modelId}: ${message}`);
    return { response: `Mock response to: ${message}`, success: true };
  },

  stopGeneration: async (generationId) => {
    console.warn(`Mock: stopGeneration - ${generationId}`);
    return { success: true };
  },

  ////// Storage APIs - New organized structure
  storage: {
    profiles: {
      getAll: async () => {
        console.warn('Mock: storage.profiles.getAll');
        return { profiles: [] };
      },
      get: async (profileId) => {
        console.warn(`Mock: storage.profiles.get - ${profileId}`);
        return { id: profileId, name: 'Default' };
      },
      create: async (profileData) => {
        console.warn('Mock: storage.profiles.create');
        return { id: 'mock-profile-id', ...profileData };
      },
      update: async (profileId, updates) => {
        console.warn(`Mock: storage.profiles.update - ${profileId}`);
        return { success: true };
      },
      delete: async (profileId) => {
        console.warn(`Mock: storage.profiles.delete - ${profileId}`);
        return { success: true };
      },
      import: async (filePath) => {
        console.warn('Mock: storage.profiles.import');
        return { success: false };
      },
      export: async (profileId, exportPath) => {
        console.warn('Mock: storage.profiles.export');
        return { success: false };
      }
    },

    chats: {
      getAll: async (profileId) => {
        console.warn(`Mock: storage.chats.getAll - ${profileId}`);
        return { chats: [] };
      },
      get: async (chatId) => {
        console.warn(`Mock: storage.chats.get - ${chatId}`);
        return { id: chatId, title: 'Mock Chat', messages: [] };
      },
      create: async (chatData) => {
        console.warn('Mock: storage.chats.create');
        return { id: `mock-chat-${Date.now()}`, ...chatData };
      },
      update: async (chatId, updates) => {
        console.warn(`Mock: storage.chats.update - ${chatId}`);
        return { success: true };
      },
      delete: async (chatId) => {
        console.warn(`Mock: storage.chats.delete - ${chatId}`);
        return { success: true };
      },
      appendMessage: async (chatId, message) => {
        console.warn(`Mock: storage.chats.appendMessage - ${chatId}`);
        return { success: true };
      },
      deleteMessage: async (chatId, messageId) => {
        console.warn(`Mock: storage.chats.deleteMessage - ${chatId}, ${messageId}`);
        return { success: true };
      },
      clearMessages: async (chatId) => {
        console.warn(`Mock: storage.chats.clearMessages - ${chatId}`);
        return { success: true };
      },
      search: async (query, profileId) => {
        console.warn(`Mock: storage.chats.search - ${query}`);
        return { chats: [] };
      }
    },

    settings: {
      getAll: async () => {
        console.warn('Mock: storage.settings.getAll');
        return { settings: { general: {}, chat: {}, performance: {} } };
      },
      getSection: async (section) => {
        console.warn(`Mock: storage.settings.getSection - ${section}`);
        return { settings: {} };
      },
      update: async (settings) => {
        console.warn('Mock: storage.settings.update');
        return { success: true };
      },
      updateSection: async (section, values) => {
        console.warn(`Mock: storage.settings.updateSection - ${section}`);
        return { success: true };
      },
      reset: async () => {
        console.warn('Mock: storage.settings.reset');
        return { success: true };
      },
      resetSection: async (section) => {
        console.warn(`Mock: storage.settings.resetSection - ${section}`);
        return { success: true };
      },
      export: async (exportPath) => {
        console.warn('Mock: storage.settings.export');
        return { success: false };
      },
      import: async (importPath) => {
        console.warn('Mock: storage.settings.import');
        return { success: false };
      }
    }
  },

  ////// Legacy APIs for backward compatibility
  getChatHistory: async () => {
    console.warn('Mock: getChatHistory (legacy) - returning empty array');
    return [];
  },

  deleteChat: async (chatId) => {
    console.warn(`Mock: deleteChat (legacy) - ${chatId}`);
    return { success: true };
  },

  saveChat: async (chat) => {
    console.warn('Mock: saveChat (legacy)');
    return { success: true };
  },

  getSettings: async () => {
    console.warn('Mock: getSettings (legacy)');
    return {};
  },

  saveSettings: async (settings) => {
    console.warn('Mock: saveSettings (legacy)');
    return { success: true };
  },

  getChatSettings: async () => {
    console.warn('Mock: getChatSettings (legacy)');
    return {
      historyEnabled: true,
      maxHistoryLength: 100,
      temperature: 0.7,
      maxTokens: 2048,
    };
  },

  saveChatSettings: async (settings) => {
    console.warn('Mock: saveChatSettings (legacy)');
    return { success: true };
  },

  getPerformanceSettings: async () => {
    console.warn('Mock: getPerformanceSettings (legacy)');
    return {
      threads: 4,
      cpuLimit: 80,
      memoryLimit: 4096,
      batch_size: 32,
      context_length: 2048,
    };
  },

  savePerformanceSettings: async (settings) => {
    console.warn('Mock: savePerformanceSettings (legacy)');
    return { success: true };
  },

  ////// Navigation APIs
  navigateToChat: (modelId) => {
    console.warn(`Mock: navigateToChat - ${modelId}`);
  },

  onNavigate: (callback) => {
    console.warn('Mock: onNavigate');
    return () => {};
  }
};
