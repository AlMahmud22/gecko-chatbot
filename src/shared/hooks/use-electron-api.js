// Custom hook for Electron API access
import { useContext } from 'react';
import { ElectronApiContext } from '../contexts/electron-api-context.jsx';

export const useElectronApi = () => {
  const context = useContext(ElectronApiContext);
  
  if (context === undefined) {
    throw new Error('useElectronApi must be used within an ElectronApiProvider');
  }
  
  return context;
};

// Custom hook with typed methods for better DX
export const useElectronServices = () => {
  const api = useElectronApi();
  
  return {
    // Auth services
    auth: {
      getToken: api.getAuthToken,
      saveToken: api.saveAuthToken,
      clearToken: api.clearAuthToken,
      getHfToken: api.getHuggingFaceToken,
      saveHfToken: api.saveHuggingFaceToken,
      login: api.login,
      logout: api.logout,
      getStatus: api.getAuthStatus,
      getProfile: api.getUserProfile,
      refresh: api.refreshAuth
    },
    
    // Models services
    models: {
      getAvailable: api.getAvailableModels,
      fetchDetails: api.fetchModelDetails,
      download: api.downloadModel,
      delete: api.deleteModel,
      installLocal: api.installLocalModel,
      getLocal: api.getLocalModels,
      openFolder: api.openModelsFolder
    },
    
    // HuggingFace services
    huggingface: {
      fetchModels: api.fetchHuggingFaceModels,
      fetchDetails: api.fetchHuggingFaceModelDetails,
      fetchFiles: api.fetchHuggingFaceModelFiles
    },
    
    // System services
    system: {
      getInfo: api.getSystemInfo,
      isDevelopment: api.isDevelopment
    },
    
    // Settings services
    settings: {
      get: api.getSettings,
      save: api.saveSettings,
      getChat: api.getChatSettings,
      saveChat: api.saveChatSettings,
      getPerformance: api.getPerformanceSettings,
      savePerformance: api.savePerformanceSettings
    },
    
    // Chat services
    chat: {
      getHistory: api.getChatHistory,
      save: api.saveChat,
      delete: api.deleteChat,
      runInference: api.runInference
    },
    
    // Navigation
    navigation: {
      onNavigate: api.onNavigate
    },
    
    // External
    external: {
      openUrl: api.openExternalUrl
    }
  };
};

export default useElectronApi;
