import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useElectronApi } from '../contexts/ElectronApiContext';
import ModelCard from '../components/Models/ModelCard';
import Spinner from '../components/Common/Spinner';
import { 
  FolderIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusCircleIcon 
} from '@heroicons/react/24/outline';
import './ModelsPage.css';

export default function ModelsPage() {
  const electronApi = useElectronApi();
  ////// Destructure APIs from the context
  const { 
    getSystemInfo, 
    downloadModel, 
    deleteModel, 
    getLocalModels,
    getAvailableModels,
    installLocalModel,
    fetchModelDetails,
    activateModel,
    deactivateModel,
    getModelsDirectory,
    changeModelsDirectory,
    resetModelsDirectory,
    openModelsFolder
  } = electronApi;

  ////// State management - local models only
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isLocalModelLoading, setIsLocalModelLoading] = useState(false);
  const [modelsDirectory, setModelsDirectory] = useState('');

  ////// Load models directory on mount
  useEffect(() => {
    const loadModelsDir = async () => {
      try {
        const result = await getModelsDirectory();
        if (result.success) {
          setModelsDirectory(result.path);
        }
      } catch (err) {
        console.error('Failed to load models directory:', err);
      }
    };
    loadModelsDir();
  }, [getModelsDirectory]);

  ////// Load local models from root/models folder on mount
  useEffect(() => {
    loadLocalModels();
  }, []);

  ////// Load local models from the models directory
  const loadLocalModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading local models from models folder...');
      const response = await getAvailableModels();
      console.log('Loaded available models response:', response);
      
      // Extract models array from response object
      const localModels = response?.models || [];
      
      ////// Process and set models with activation state
      const processedModels = (Array.isArray(localModels) ? localModels : []).map(model => ({
        ...model,
        id: model.id || model._id || model.name || model.modelId || 'unknown-model',
        isInstalled: true,
        isActive: model.active || model.isActive || false
      }));
      
      setModels(processedModels);
      console.log(`Loaded ${processedModels.length} local models`);
    } catch (err) {
      console.error('Failed to load local models:', err);
      setError('Failed to load models from models folder.');
    } finally {
      setLoading(false);
    }
  }, [getAvailableModels]);

  ////// Handle search in local models
  const handleSearch = useCallback(async (searchTerm) => {
    setSearchQuery(searchTerm);
  }, []);


  ////// Load system info
  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const sysInfo = await getSystemInfo();
        setSystemInfo(sysInfo);
      } catch (err) {
        console.error('Failed to fetch system info:', err);
      }
    };
    loadSystemInfo();
  }, [getSystemInfo]);

  ////// Handler for changing models directory
  const handleChangeModelsDirectory = async () => {
    try {
      setError(null);
      const result = await changeModelsDirectory();
      
      if (result.success && !result.cancelled) {
        setModelsDirectory(result.path);
        setError(`  Models directory changed to: ${result.path}`);
        // Reload models from new directory
        await loadLocalModels();
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Failed to change models directory:', err);
      setError(`  Failed to change directory: ${err.message}`);
    }
  };
  
  ////// Handler for adding a local model file
  const handleAddLocalModel = async () => {
    try {
      setIsLocalModelLoading(true);
      const result = await installLocalModel();
      if (result.success) {
        await loadLocalModels();
        setError(`  Successfully added ${result.modelName || 'model'}`);
        setTimeout(() => setError(null), 3000);
      } else {
        setError(`  Failed to add model: ${result.message}`);
      }
    } catch (err) {
      console.error('Error adding local model:', err);
      setError('  An error occurred while adding the local model');
    } finally {
      setIsLocalModelLoading(false);
    }
  };

  ////// Handle model selection
  const handleModelClick = async (model) => {
    setSelectedModel({ ...model });
  };

  ////// Handle model activation
  const handleActivateModel = async (modelId) => {
    try {
      setError(null);
      console.log(`Activating model: ${modelId}`);
      
      const result = await activateModel(modelId);
      
      if (result.success) {
        ////// Update local state to reflect activation
        setModels(prev => prev.map(m => 
          m.id === modelId ? { ...m, isActive: true } : m
        ));
        setError(`  Model activated successfully`);
        setTimeout(() => setError(null), 3000);
        
        ////// Notify other components that models list has changed
        window.dispatchEvent(new CustomEvent('modelsChanged', { detail: { action: 'activate', modelId } }));
      } else {
        setError(`  Failed to activate model: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to activate model:', err);
      setError(`  Failed to activate model: ${err.message}`);
    }
  };

  ////// Handle model deactivation
  const handleDeactivateModel = async (modelId) => {
    try {
      setError(null);
      console.log(`Deactivating model: ${modelId}`);
      
      const result = await deactivateModel(modelId);
      
      if (result.success) {
        ////// Update local state to reflect deactivation
        setModels(prev => prev.map(m => 
          m.id === modelId ? { ...m, isActive: false } : m
        ));
        setError(`  Model deactivated successfully`);
        setTimeout(() => setError(null), 3000);
        
        ////// Notify other components that models list has changed
        window.dispatchEvent(new CustomEvent('modelsChanged', { detail: { action: 'deactivate', modelId } }));
      } else {
        setError(`  Failed to deactivate model: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to deactivate model:', err);
      setError(`  Failed to deactivate model: ${err.message}`);
    }
  };

  ////// Handle model deletion
  const handleDeleteModel = async (modelId) => {
    try {
      setError(null);
      await deleteModel(modelId.replace('.gguf', ''));
      await loadLocalModels();
      setError(`  Model deleted successfully`);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to delete model:', err);
      setError(`  Failed to delete model: ${err.message}`);
    }
  };

  ////// Filter models based on search query and active tab
  const getFilteredModels = () => {
    let filtered = models;
    
    ////// Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(model => 
        model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    ////// Apply tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(model => model.isActive === true || model.active === true);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(model => !model.isActive && !model.active);
    }
    // 'all' tab shows everything, no additional filtering needed
    
    return filtered;
  };

  const filteredModels = getFilteredModels();

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-white">Local Models</h1>
          <span className="text-sm text-gray-400">({models.length} models)</span>
        </div>
        
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search models..."
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg py-2 px-4 text-gray-200 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>
      </motion.div>

      {/* Add Model and Refresh buttons */}
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex space-x-3">
          <motion.button
            className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg font-medium text-sm hover:bg-green-800 transition-all shadow-md"
            onClick={handleAddLocalModel}
            whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
            whileTap={{ scale: 0.97 }}
            disabled={isLocalModelLoading}
          >
            {isLocalModelLoading ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <PlusCircleIcon className="w-4 h-4 mr-2" />
            )}
            Add Model
          </motion.button>
          
          <motion.button
            className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg font-medium text-sm hover:bg-gray-600 transition-all"
            onClick={loadLocalModels}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
          >
            {loading ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Models directory:</span>
            <code className="bg-[#2a2a2a] px-2 py-1 rounded text-xs max-w-md truncate" title={modelsDirectory}>
              {modelsDirectory || 'Loading...'}
            </code>
          </div>
          <motion.button
            onClick={handleChangeModelsDirectory}
            className="px-3 py-1 bg-green-700 text-white text-xs rounded-lg hover:bg-green-800 transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Change Directory
          </motion.button>
        </div>
      </motion.div>
      
      {/* Tabs */}
      <motion.div 
        className="flex mb-6 border-b border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <TabButton 
          isActive={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        >
          All Models
          <motion.span 
            className="ml-2 bg-green-600 text-white rounded-full px-2 py-0.5 text-xs"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            {models.length}
          </motion.span>
        </TabButton>
        
        <TabButton 
          isActive={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
        >
          Active Models
          {models.filter(m => m.isActive).length > 0 && (
            <motion.span 
              className="ml-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {models.filter(m => m.isActive).length}
            </motion.span>
          )}
        </TabButton>
        
        <TabButton 
          isActive={activeTab === 'inactive'}
          onClick={() => setActiveTab('inactive')}
        >
          Inactive Models
          {models.filter(m => !m.isActive).length > 0 && (
            <motion.span 
              className="ml-2 bg-gray-500 text-white rounded-full px-2 py-0.5 text-xs"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {models.filter(m => !m.isActive).length}
            </motion.span>
          )}
        </TabButton>
      </motion.div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className={`rounded-lg p-4 mb-6 flex items-center ${
              error.startsWith(' ') 
                ? 'bg-green-500 bg-opacity-20 border border-green-500 text-green-100'
                : 'bg-red-500 bg-opacity-20 border border-red-500 text-red-100'
            }`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error.startsWith(' ') ? (
              <CheckCircleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            )}
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && models.length === 0 && (
        <div className="flex justify-center items-center py-16">
          <Spinner className="w-8 h-8" />
          <span className="ml-3 text-gray-400">Loading models...</span>
        </div>
      )}

      {/* Models Grid */}
      <AnimatePresence>
        {filteredModels.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {filteredModels.map((model) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ModelCard
                  model={model}
                  systemInfo={systemInfo}
                  isActive={model.isActive}
                  onClick={() => handleModelClick(model)}
                  onActivate={() => handleActivateModel(model.id)}
                  onDeactivate={() => handleDeactivateModel(model.id)}
                  onDelete={() => {
                    if (window.confirm(`Are you sure you want to delete ${model.name || model.id}?`)) {
                      handleDeleteModel(model.id);
                    }
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : !loading ? (
          <EmptyState
            icon={activeTab === 'active' ? CheckCircleIcon : activeTab === 'inactive' ? ExclamationTriangleIcon : FolderIcon}
            title={
              activeTab === 'active' ? 'No active models' :
              activeTab === 'inactive' ? 'No inactive models' :
              searchQuery ? 'No models found' : 'No models in folder'
            }
            description={
              activeTab === 'active' ? 'Activate models from the All Models or Inactive Models tab to see them here.' :
              activeTab === 'inactive' ? 'All your models are active! Deactivate some from the Active Models tab.' :
              searchQuery ? 'Try a different search term.' : 'Add models to the root/models folder or click "Add Model" to import a model file.'
            }
            actions={activeTab === 'all' && !searchQuery ? [{
              label: 'Add Model',
              onClick: handleAddLocalModel,
              primary: true,
              loading: isLocalModelLoading,
              icon: PlusCircleIcon
            }] : []}
          />
        ) : null}
      </AnimatePresence>


    </div>
  );
}

// Helper Components
function TabButton({ isActive, onClick, children }) {
  return (
    <motion.button 
      className={`px-4 py-2 font-medium text-sm flex items-center ${
        isActive 
          ? 'text-green-500 border-b-2 border-green-500' 
          : 'text-gray-400 hover:text-white'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

function EmptyState({ icon: Icon, title, description, actions = [] }) {
  return (
    <motion.div 
      className="col-span-full flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Icon className="w-16 h-16 text-gray-500 mb-4" />
      <h3 className="text-white text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6">{description}</p>
      {actions.length > 0 && (
        <div className="flex space-x-4">
          {actions.map((action, index) => (
            <motion.button
              key={index}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                action.primary 
                  ? 'bg-green-700 text-white hover:bg-green-800 shadow-md' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              onClick={action.onClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              disabled={action.loading}
            >
              {action.loading ? (
                <Spinner className="w-4 h-4 mr-2" />
              ) : action.icon ? (
                <action.icon className="w-4 h-4 mr-2" />
              ) : null}
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// PropTypes for helper components
TabButton.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

EmptyState.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    primary: PropTypes.bool,
    loading: PropTypes.bool,
    icon: PropTypes.elementType,
  })),
};
