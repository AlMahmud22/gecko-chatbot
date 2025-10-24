import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Authentication state
  authToken: null,
  huggingFaceToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  setAuthToken: (token) => set({ authToken: token, isAuthenticated: !!token }),
  setHuggingFaceToken: (token) => set({ huggingFaceToken: token }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  login: async (authData) => {
    set({ 
      authToken: authData.token, 
      huggingFaceToken: authData.hfToken,
      user: authData.user,
      isAuthenticated: true 
    });
  },
  
  logout: () => set({ 
    authToken: null, 
    huggingFaceToken: null,
    user: null, 
    isAuthenticated: false 
  }),

  // Models state  
  activeModel: null,
  setActiveModel: (modelId) => set({ activeModel: modelId }),
  
  // Hugging Face models state
  models: [],
  installedModels: [],
  favoriteModels: [],
  setModels: (models) => set({ models }),
  setInstalledModels: (installedModels) => set({ installedModels }),
  addFavoriteModel: (modelId) => set((state) => ({
    favoriteModels: [...state.favoriteModels, modelId]
  })),
  removeFavoriteModel: (modelId) => set((state) => ({
    favoriteModels: state.favoriteModels.filter(id => id !== modelId)
  })),
  
  // Models filters
  filters: {
    task: ['text-generation'],
    library: ['gguf'],
    size: [],
    license: [],
    language: [],
    sort: 'downloads'
  },
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  chatSettings: {
    maxTokens: 2048,
    promptSize: 512,
    temperature: 0.7,
    topP: 0.9,
    systemPrompt: '',
    saveHistory: true,
    codeHighlighting: true,
    markdownRendering: true,
  },
  updateChatSettings: (settings) => set((state) => ({
    chatSettings: { ...state.chatSettings, ...settings },
  })),
  performanceSettings: {
    threads: 4,
    top_k: 40,
    top_p: 0.9,
    temperature: 0.7,
  },
  updatePerformanceSettings: (settings) => set((state) => ({
    performanceSettings: { ...state.performanceSettings, ...settings },
  })),
}));

export default useStore;