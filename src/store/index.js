// Main Store - Combines all slices
import useAuthStore from './auth-store.js';
import useModelsStore from './models-store.js';
import useChatStore from './chat-store.js';
import useSettingsStore from './settings-store.js';

// Re-export individual stores
export { useAuthStore, useModelsStore, useChatStore, useSettingsStore };

// Combined store for convenience (if needed)
export const useAppStore = () => ({
  auth: useAuthStore(),
  models: useModelsStore(),
  chat: useChatStore(),
  settings: useSettingsStore()
});

// Legacy compatibility - maps old store to new structure
export const useStore = () => {
  const auth = useAuthStore();
  const models = useModelsStore();
  const chat = useChatStore();
  const settings = useSettingsStore();
  
  return {
    // Auth state (legacy compatibility)
    authToken: auth.authToken,
    huggingFaceToken: auth.huggingFaceToken,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    setAuthToken: auth.setAuthToken,
    setHuggingFaceToken: auth.setHuggingFaceToken,
    setUser: auth.setUser,
    setLoading: auth.setLoading,
    login: auth.login,
    logout: auth.logout,
    
    // Models state (legacy compatibility)
    activeModel: models.activeModel,
    models: models.models,
    installedModels: models.installedModels,
    favoriteModels: models.favoriteModels,
    filters: models.filters,
    setActiveModel: models.setActiveModel,
    setModels: models.setModels,
    setInstalledModels: models.setInstalledModels,
    addFavoriteModel: models.addFavoriteModel,
    removeFavoriteModel: models.removeFavoriteModel,
    updateFilters: models.updateFilters,
    
    // Chat state (legacy compatibility)
    chatSettings: chat.settings,
    updateChatSettings: chat.updateSettings,
    
    // Settings state (legacy compatibility)
    performanceSettings: settings.performance,
    updatePerformanceSettings: settings.updatePerformance
  };
};

export default useStore;
