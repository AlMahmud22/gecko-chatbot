// Custom hook for models management
import { useCallback, useEffect } from 'react';
import { useModelsStore } from '../../store/models-store.js';
import { useElectronServices } from './use-electron-api.js';

export const useModels = () => {
  const store = useModelsStore();
  const { models: modelsApi, huggingface } = useElectronServices();
  
  // Load installed models
  const loadInstalledModels = useCallback(async () => {
    try {
      store.setLoading(true);
      const installedModels = await modelsApi.getLocal();
      store.setInstalledModels(installedModels);
      store.setError(null);
    } catch (error) {
      console.error('Failed to load installed models:', error);
      store.setError('Failed to load installed models');
    } finally {
      store.setLoading(false);
    }
  }, [modelsApi, store]);
  
  // Load HuggingFace models
  const loadHuggingFaceModels = useCallback(async (options = {}) => {
    try {
      store.setLoading(true);
      const result = await huggingface.fetchModels({
        ...store.filters,
        search: store.searchQuery,
        ...options
      });
      store.setModels(result.models || []);
      store.setError(null);
      return result;
    } catch (error) {
      console.error('Failed to load HuggingFace models:', error);
      store.setError('Failed to load models from HuggingFace');
      return { models: [], nextUrl: null };
    } finally {
      store.setLoading(false);
    }
  }, [huggingface, store]);
  
  // Download model
  const downloadModel = useCallback(async (modelId, fileName) => {
    try {
      store.updateDownloadProgress(modelId, 0);
      await modelsApi.download(modelId, fileName);
      store.removeDownloadProgress(modelId);
      await loadInstalledModels(); // Refresh installed models
      return { success: true };
    } catch (error) {
      console.error('Failed to download model:', error);
      store.removeDownloadProgress(modelId);
      store.setError(`Failed to download ${modelId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [modelsApi, store, loadInstalledModels]);
  
  // Delete model
  const deleteModel = useCallback(async (modelId) => {
    try {
      await modelsApi.delete(modelId);
      await loadInstalledModels(); // Refresh installed models
      return { success: true };
    } catch (error) {
      console.error('Failed to delete model:', error);
      store.setError(`Failed to delete ${modelId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [modelsApi, store, loadInstalledModels]);
  
  // Toggle favorite
  const toggleFavorite = useCallback((modelId) => {
    if (store.favoriteModels.includes(modelId)) {
      store.removeFavoriteModel(modelId);
    } else {
      store.addFavoriteModel(modelId);
    }
  }, [store]);
  
  // Search models
  const searchModels = useCallback((query) => {
    store.setSearchQuery(query);
    // Debounced search will be handled by the component
  }, [store]);
  
  // Update filters
  const updateFilters = useCallback((newFilters) => {
    store.updateFilters(newFilters);
  }, [store]);
  
  // Initialize on mount
  useEffect(() => {
    loadInstalledModels();
  }, [loadInstalledModels]);
  
  return {
    // State
    models: store.models,
    installedModels: store.installedModels,
    favoriteModels: store.favoriteModels,
    downloadingModels: store.downloadingModels,
    activeModel: store.activeModel,
    filters: store.filters,
    searchQuery: store.searchQuery,
    isLoading: store.isLoading,
    error: store.error,
    
    // Computed
    filteredModels: store.getFilteredModels(),
    favoriteModelsList: store.getFavoriteModels(),
    
    // Actions
    loadInstalledModels,
    loadHuggingFaceModels,
    downloadModel,
    deleteModel,
    toggleFavorite,
    searchModels,
    updateFilters,
    setActiveModel: store.setActiveModel,
    clearError: () => store.setError(null)
  };
};

export default useModels;
