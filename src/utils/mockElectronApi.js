// Mock implementation of Electron API for development
export const mockElectronApi = {
  // System
  getSystemInfo: async () => ({
    platform: 'win32',
    arch: 'x64',
    cpu: {
      model: 'Intel Mock CPU',
      cores: 8
    },
    memory: {
      total: 16000000000,
      free: 8000000000
    },
    gpu: 'Mock GPU'
  }),
  onThemeUpdated: (callback) => {
    // Mock theme updates
    const mockTheme = { shouldUseDarkColors: window.matchMedia('(prefers-color-scheme: dark)').matches };
    callback(mockTheme);
    return () => {};
  },

  // File operations
  openFileDialog: async () => ({
    canceled: false,
    filePaths: ['/path/to/mock/model.gguf']
  }),
  openModelsFolder: async () => {
    console.log('Mock: Opening models folder');
    return { success: true };
  },
  getAvailableModels: async () => {
    return [
      {
        id: 'test-model-1',
        name: 'Test Model 1',
        description: 'A test model for development',
        isInstalled: true,
        size: '1.1GB',
      },
      {
        id: 'test-model-2',
        name: 'Test Model 2',
        description: 'Another test model for development',
        isInstalled: false,
        size: '2.2GB',
      },
    ];
  },
  fetchModelDetails: async (modelId) => {
    return {
      id: modelId,
      name: `Test Model ${modelId}`,
      description: 'Detailed description for development',
      size: '1.1GB',
      isInstalled: true,
    };
  },
  downloadModel: async (modelId) => {
    return { success: true };
  },
  deleteModel: async (modelId) => {
    return { success: true };
  },
  installLocalModel: async () => {
    // Simulate file picker dialog and model installation
    const fileNames = ['llama-2-7b-chat.Q4_K_M.gguf', 'mistral-7b-instruct-v0.1.Q4_K_M.gguf', 'codegemma-2b.Q4_K_M.gguf'];
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    const modelName = randomFile.replace('.Q4_K_M.gguf', '');
    
    return { 
      success: true,
      message: 'Model imported successfully', 
      modelName: modelName,
      model: {
        _id: randomFile,
        id: randomFile.replace('.gguf', ''),
        name: modelName,
        filePath: `models/${randomFile}`,
        downloadedAt: new Date().toISOString(),
        size: Math.floor(Math.random() * 5000000000) + 500000000, // Random size between 500MB-5.5GB
        quant: 'Q4_K_M',
        parameters: ['7B', '2B', '13B'][Math.floor(Math.random() * 3)],
        tags: ['local', 'gguf'],
        description: `Local model: ${modelName}`,
        license: 'Unknown',
        downloads: 0,
        isInstalled: true,
      }
    };
  },
  getLocalModels: async () => {
    // Mock installed models with realistic data
    return [
      {
        id: 'llama-2-7b-chat-q4',
        _id: 'llama-2-7b-chat.Q4_K_M.gguf',
        name: 'Llama 2 7B Chat',
        file_path: '/path/to/models/llama-2-7b-chat.Q4_K_M.gguf',
        size: 3800000000, // ~3.8GB
        description: 'Meta Llama 2 7B Chat model optimized for conversations',
        quant: 'Q4_K_M',
        parameters: '7B',
        tags: ['local', 'chat', 'llama2'],
        license: 'Custom',
        downloads: 0,
        downloadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isInstalled: true,
      },
      {
        id: 'mistral-7b-instruct-v01',
        _id: 'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
        name: 'Mistral 7B Instruct v0.1',
        file_path: '/path/to/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf',
        size: 4100000000, // ~4.1GB
        description: 'Mistral 7B model fine-tuned for instruction following',
        quant: 'Q4_K_M',
        parameters: '7B',
        tags: ['local', 'instruct', 'mistral'],
        license: 'Apache-2.0',
        downloads: 0,
        downloadedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        isInstalled: true,
      }
    ];
  },
  openModelsFolder: async () => {
    console.log('Mock: Opening models folder');
    return { success: true, message: 'Models folder opened' };
  },
  runInference: async ({ modelId, message }) => {
    return {
      response: `[DEV MODE] Response from ${modelId}: ${message}`,
    };
  },

  // Settings
  getSettings: async () => ({
    theme: 'system',
    inferenceParams: {
      temperature: 0.7,
      maxTokens: 1000,
    }
  }),
  saveSettings: async (settings) => ({ success: true }),
  
  // Chat Settings
  getChatSettings: async () => ({
    historyEnabled: true,
    maxHistoryLength: 100,
    temperature: 0.7,
    maxTokens: 1000
  }),
  saveChatSettings: async (settings) => ({ success: true }),
  
  // Performance Settings
  getPerformanceSettings: async () => ({
    threads: 4,
    batchSize: 512,
    contextSize: 2048
  }),
  savePerformanceSettings: async (settings) => ({ success: true }),
  
  // System Settings
  getPaths: async () => ({
    appData: '/mock/appData',
    userData: '/mock/userData',
    temp: '/mock/temp',
    downloads: '/mock/downloads',
    documents: '/mock/documents'
  }),

  // Chat History
  getChatHistory: async () => [{
    id: 'chat-1',
    title: 'Test Chat 1',
    modelId: 'test-model-1',
    timestamp: new Date().toISOString(),
  }],
  saveChat: async (chat) => ({ success: true }),
  deleteChat: async (chatId) => ({ success: true }),

  // Navigation
  onNavigate: (callback) => {
    // Mock navigation events
    return () => {};
  },

  // Authentication
  getAuthToken: async () => null,
  saveAuthToken: async (token) => ({ success: true }),
  clearAuthToken: async () => ({ success: true }),
  getHuggingFaceToken: async () => null,
  saveHuggingFaceToken: async (token) => ({ success: true }),
  login: async (provider = 'google', customRedirect = null) => {
    console.log(`Mock: Initiating login with provider: ${provider}, redirect: ${customRedirect}`);
    const baseUrl = process.env.BASE_URL || 'https://equators.tech';
    return { success: true, loginUrl: `${baseUrl}/auth/${provider}/redirect?redirect=${encodeURIComponent(customRedirect || 'equatorschatbot://auth/callback')}` };
  },
  
  // Enhanced auth methods
  getAuthStatus: async () => ({
    isAuthenticated: false,
    user: null,
    token: null,
    hfToken: null
  }),
  getUserProfile: async () => null,
  refreshAuth: async () => ({ success: false, error: 'Not available in development' }),
  logout: async () => ({ success: true }),

  // External URLs
  openExternalUrl: async (url) => {
    console.log('Mock: Would open URL:', url);
    return { success: true };
  },

  // Auth callbacks (for deep linking)
  onAuthCallback: (callback) => {
    // Mock auth callback
    return () => {};
  },
  
  onAuthError: (callback) => {
    // Mock auth error callback
    return () => {};
  }
};
