// Models State Slice
import { create } from 'zustand';

const useModelsStore = create((set, get) => ({
  // State
  activeModel: null,
  models: [],
  installedModels: [],
  favoriteModels: [],
  downloadingModels: {},
  
  // Filters state
  filters: {
    task: ['text-generation'],
    library: ['gguf'],
    size: [],
    license: [],
    language: [],
    sort: 'downloads'
  },
  
  searchQuery: '',
  isLoading: false,
  error: null,
  
  // Actions
  setActiveModel: (modelId) => set({ activeModel: modelId }),
  
  setModels: (models) => set({ models }),
  
  setInstalledModels: (installedModels) => set({ installedModels }),
  
  addFavoriteModel: (modelId) => set((state) => ({
    favoriteModels: [...state.favoriteModels, modelId]
  })),
  
  removeFavoriteModel: (modelId) => set((state) => ({
    favoriteModels: state.favoriteModels.filter(id => id !== modelId)
  })),
  
  updateFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  // Download progress tracking
  updateDownloadProgress: (modelId, progress) => set((state) => ({
    downloadingModels: {
      ...state.downloadingModels,
      [modelId]: progress
    }
  })),
  
  removeDownloadProgress: (modelId) => set((state) => {
    const newDownloading = { ...state.downloadingModels };
    delete newDownloading[modelId];
    return { downloadingModels: newDownloading };
  }),
  
  // Getters
  getFavoriteModels: () => {
    const state = get();
    return state.models.filter(model => 
      state.favoriteModels.includes(model.id)
    );
  },
  
  getFilteredModels: () => {
    const state = get();
    const { models, filters, searchQuery } = state;
    
    return models.filter(model => {
      // Search filter
      if (searchQuery && !model.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Task filter
      if (filters.task.length > 0 && !filters.task.includes(model.pipeline_tag)) {
        return false;
      }
      
      // Library filter
      if (filters.library.length > 0) {
        const hasLibrary = filters.library.some(lib => 
          model.tags?.includes(lib) || model.library_name === lib
        );
        if (!hasLibrary) return false;
      }
      
      return true;
    });
  }
}));

export default useModelsStore;
