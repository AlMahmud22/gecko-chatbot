import React, { useState, useEffect, useCallback, Suspense } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useElectronApi } from '../contexts/ElectronApiContext';
import ModelCard from '../components/Models/ModelCard';
const ModelDetails = React.lazy(() => import('../components/Models/ModelDetails'));
import ModelDownloader from '../components/Models/ModelDownloader';
import InstalledModelsTab from '../components/Models/InstalledModelsTab';
import Spinner from '../components/Common/Spinner';
import SearchSortBar from '../components/Models/SearchSortBar';
import FiltersPanel from '../components/Models/FiltersPanel';
import { 
  HeartIcon, 
  FolderIcon, 
  PlusCircleIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import './ModelsPage.css';

export default function ModelsPage() {
  const { 
    getSystemInfo, 
    downloadModel, 
    deleteModel, 
    getSettings, 
    saveSettings, 
    getLocalModels, 
    installLocalModel 
  } = useElectronApi();

  // State management
  const [models, setModels] = useState([]);
  const [installedModels, setInstalledModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [favoriteModels, setFavoriteModels] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('downloads'); // Better default
  const [pageNextUrl, setPageNextUrl] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLocalModelLoading, setIsLocalModelLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    task: ['text-generation'], // Default to text-generation models
    library: ['gguf'], // Default to GGUF models for local inference
    size: [],
    license: [],
    language: []
  });

  // Initialize with popular models on mount
  useEffect(() => {
    const initializeModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading initial models...');
        const { models: initialModels, nextUrl } = await fetchModels({
          sort: 'downloads',
          limit: 20,
          task: filters.task,
          library: filters.library,
        });
        
        const processedModels = processModels(initialModels);
        setModels(processedModels);
        setPageNextUrl(nextUrl);
        console.log(`Loaded ${processedModels.length} initial models`);
      } catch (err) {
        console.error('Failed to load initial models:', err);
        setError('Failed to load models. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeModels();
  }, []); // Only run on mount

  // Handle search with proper debouncing (trigger only on ENTER or search button)
  const handleSearch = useCallback(async (searchTerm) => {
    console.log(`Searching for: "${searchTerm}"`);
    setSearchQuery(searchTerm);
    setLoading(true);
    setError(null);
    setModels([]); // Clear existing models
    
    try {
      const { models: searchResults, nextUrl } = await fetchModels({
        search: searchTerm.trim(),
        sort: sortBy,
        limit: 20,
        task: filters.task,
        library: filters.library,
        filters: {
          language: filters.language.length > 0 ? filters.language[0] : undefined,
          license: filters.license.length > 0 ? filters.license[0] : undefined,
        }
      });
      
      const processedModels = processModels(searchResults);
      setModels(processedModels);
      setPageNextUrl(nextUrl);
      
      console.log(`Search returned ${processedModels.length} models`);
    } catch (err) {
      console.error('Search failed:', err);
      setError(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [sortBy, filters]);

  // Handle sort change
  const handleSortChange = useCallback(async (newSort) => {
    console.log(`Changing sort to: ${newSort}`);
    setSortBy(newSort);
    setLoading(true);
    setError(null);
    setModels([]);
    
    try {
      const { models: sortedModels, nextUrl } = await fetchModels({
        search: searchQuery.trim(),
        sort: newSort,
        limit: 20,
        task: filters.task,
        library: filters.library,
      });
      
      const processedModels = processModels(sortedModels);
      setModels(processedModels);
      setPageNextUrl(nextUrl);
    } catch (err) {
      console.error('Sort change failed:', err);
      setError(`Failed to sort models: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  // Load more models for infinite scroll
  const loadMore = useCallback(async () => {
    if (!pageNextUrl || isLoadingMore || loading) return;
    
    console.log('Loading more models...');
    setIsLoadingMore(true);
    
    try {
      const { models: moreModels, nextUrl } = await fetchModels({
        pageUrl: pageNextUrl
      });
      
      const processedModels = processModels(moreModels);
      setModels(prev => [...prev, ...processedModels]);
      setPageNextUrl(nextUrl);
      
      console.log(`Loaded ${processedModels.length} additional models`);
    } catch (err) {
      console.error('Failed to load more models:', err);
      setError('Failed to load more models');
    } finally {
      setIsLoadingMore(false);
    }
  }, [pageNextUrl, isLoadingMore, loading]);

  // Fetch installed models from storage
  const loadInstalledModels = useCallback(async () => {
    try {
      const localModels = await getLocalModels();
      console.log('Loaded installed models:', localModels);
      
      const processedModels = localModels.map(model => ({
        ...model,
        id: model.id || model._id || model.name || 'unknown-model',
        isInstalled: true
      }));
      
      setInstalledModels(processedModels);
    } catch (err) {
      console.error('Failed to fetch installed models:', err);
      // Don't show error for this - it's not critical
    }
  }, [getLocalModels]);

  // Load installed models on mount
  useEffect(() => {
    loadInstalledModels();
  }, [loadInstalledModels]);

  // Load system info
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
  
  // Listen for custom events to switch tabs
  useEffect(() => {
    const handleSwitchToAllModels = () => {
      setActiveTab('all');
    };
    
    window.addEventListener('switchToAllModels', handleSwitchToAllModels);
    return () => window.removeEventListener('switchToAllModels', handleSwitchToAllModels);
  }, []);
  
  // Load favorite models from settings
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const settings = await getSettings();
        if (settings?.favoriteModels) {
          setFavoriteModels(settings.favoriteModels);
        }
      } catch (err) {
        console.error('Failed to load favorite models from settings:', err);
      }
    };
    
    if (getSettings) {
      loadFavorites();
    }
  }, [getSettings]);
  
  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (activeTab !== 'all') return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const scrollThreshold = document.body.offsetHeight - 1000;
      
      if (scrollPosition >= scrollThreshold && !isLoadingMore && pageNextUrl && !loading) {
        loadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, isLoadingMore, pageNextUrl, loading, loadMore]);
  
  // Handler for adding a local model
  const handleAddLocalModel = async () => {
    try {
      setIsLocalModelLoading(true);
      const result = await installLocalModel();
      if (result.success) {
        await loadInstalledModels();
        setActiveTab('installed');
        setError(`✅ Successfully added ${result.modelName || 'model'}`);
        setTimeout(() => setError(null), 3000);
      } else {
        setError(`❌ Failed to add model: ${result.message}`);
      }
    } catch (err) {
      console.error('Error adding local model:', err);
      setError('❌ An error occurred while adding the local model');
    } finally {
      setIsLocalModelLoading(false);
    }
  };

  // Handle model selection with detailed info fetching
  const handleModelClick = async (model) => {
    setSelectedModel({ ...model, isLoading: true });
    
    try {
      // Check if model is installed
      const isInstalled = installedModels.some(m => 
        m.id === model.id
      );
      
      // Set selected model with available info
      setSelectedModel({ 
        ...model,
        isLoading: false,
        isInstalled: isInstalled || model.isInstalled || false,
        isFavorite: favoriteModels.includes(model.id)
      });
    } catch (err) {
      console.error('Failed to fetch model details:', err);
      setSelectedModel(null);
      setError('Failed to load model details');
    }
  };

  // Handle model download
  const handleDownload = async (modelId, filename) => {
    try {
      setError(null);
      console.log(`Downloading model ${modelId} with filename ${filename}`);
      
      await downloadModel(modelId, filename);
      
      const modelName = filename.replace('.gguf', '');
      console.log(`Successfully downloaded: ${modelName}`);
      
      await loadInstalledModels();
      setActiveTab('installed');
      
      setError(`✅ Successfully installed ${modelName}`);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to download model:', err);
      setError(`❌ Failed to download model: ${err.message}`);
    }
  };

  // Handle toggling favorite status
  const handleToggleFavorite = async (modelId) => {
    const updatedFavorites = favoriteModels.includes(modelId)
      ? favoriteModels.filter(id => id !== modelId)
      : [...favoriteModels, modelId];
    
    setFavoriteModels(updatedFavorites);
    
    if (selectedModel?.id === modelId) {
      setSelectedModel(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
    
    try {
      const settings = await getSettings();
      await saveSettings({ ...settings, favoriteModels: updatedFavorites });
    } catch (err) {
      console.error('Failed to save favorite models:', err);
    }
  };

  // Filter models based on current filters and search
  const getFilteredModels = () => {
    let filtered = models;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(model => 
        model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Apply filters and reload models
  const handleApplyFilters = async () => {
    setLoading(true);
    setError(null);
    setModels([]);
    
    try {
      const { models: filteredModels, nextUrl } = await fetchModels({
        search: searchQuery.trim(),
        sort: sortBy,
        limit: 20,
        task: filters.task,
        library: filters.library,
        filters: {
          language: filters.language.length > 0 ? filters.language[0] : undefined,
          license: filters.license.length > 0 ? filters.license[0] : undefined,
        }
      });
      
      const processedModels = processModels(filteredModels);
      setModels(processedModels);
      setPageNextUrl(nextUrl);
    } catch (err) {
      console.error('Failed to apply filters:', err);
      setError(`Failed to apply filters: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      task: ['text-generation'],
      library: ['gguf'],
      size: [],
      license: [],
      language: []
    });
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
          <h1 className="text-2xl font-semibold text-white">Models</h1>
        </div>
        
        <SearchSortBar 
          searchQuery={searchQuery}
          onSearch={handleSearch}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onToggleFilters={() => setShowFilters(true)}
          showFilters={showFilters}
          isLoading={loading}
        />
      </motion.div>

      {/* Add Model Locally button */}
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all shadow-md"
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
          ➕ Add Model Locally
        </motion.button>
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
        </TabButton>
        
        <TabButton 
          isActive={activeTab === 'installed'}
          onClick={() => setActiveTab('installed')}
        >
          Installed Models
          {installedModels.length > 0 && (
            <motion.span 
              className="ml-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {installedModels.length}
            </motion.span>
          )}
        </TabButton>
        
        <TabButton 
          isActive={activeTab === 'liked'}
          onClick={() => setActiveTab('liked')}
        >
          Liked Models
          {favoriteModels.length > 0 && (
            <motion.span 
              className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {favoriteModels.length}
            </motion.span>
          )}
        </TabButton>
      </motion.div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className={`rounded-lg p-4 mb-6 flex items-center ${
              error.startsWith('✅') 
                ? 'bg-green-500 bg-opacity-20 border border-green-500 text-green-100'
                : 'bg-red-500 bg-opacity-20 border border-red-500 text-red-100'
            }`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error.startsWith('✅') ? (
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
        {activeTab === 'installed' ? (
          <InstalledModelsTab
            installedModels={installedModels}
            systemInfo={systemInfo}
            selectedModel={selectedModel}
            onModelClick={handleModelClick}
            onDelete={(modelId) => {
              deleteModel(modelId.replace('.gguf', ''))
                .then(() => loadInstalledModels())
                .catch(err => setError(`❌ Failed to delete model: ${err.message}`));
            }}
            onFavorite={handleToggleFavorite}
            favoriteModels={favoriteModels}
            onAddLocalModel={handleAddLocalModel}
            isLocalModelLoading={isLocalModelLoading}
          />
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {activeTab === 'liked' ? (
              filteredModels
                .filter(model => favoriteModels.includes(model.id))
                .length > 0 ? (
                  filteredModels
                    .filter(model => favoriteModels.includes(model.id))
                    .map((model) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ModelCard
                          model={model}
                          systemInfo={systemInfo}
                          isActive={selectedModel?.id === model.id}
                          onClick={() => handleModelClick(model)}
                          onDownload={handleDownload}
                          onFavorite={() => handleToggleFavorite(model.id)}
                          isFavorite={true}
                        />
                      </motion.div>
                    ))
                ) : (
                  <EmptyState
                    icon={HeartIcon}
                    title="No liked models yet"
                    description="Click the heart icon on any model to add it to your liked models for easy access later."
                  />
                )
            ) : (
              filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ModelCard
                      model={model}
                      systemInfo={systemInfo}
                      isActive={selectedModel?.id === model.id}
                      onClick={() => handleModelClick(model)}
                      onDownload={handleDownload}
                      onFavorite={() => handleToggleFavorite(model.id)}
                      isFavorite={favoriteModels.includes(model.id)}
                    />
                  </motion.div>
                ))
              ) : !loading && (
                <EmptyState
                  icon={ExclamationTriangleIcon}
                  title="No models found"
                  description="Try adjusting your search query or filters, or check your internet connection."
                />
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load More / Infinite Scroll */}
      {activeTab === 'all' && (
        <>
          {isLoadingMore && (
            <div className="flex justify-center my-6">
              <Spinner />
            </div>
          )}

          {!isLoadingMore && pageNextUrl && !loading && (
            <motion.button
              className="w-full py-3 mt-6 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 rounded-lg transition-colors"
              onClick={loadMore}
              whileHover={{ backgroundColor: '#3a3a3a' }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Load More Models
            </motion.button>
          )}
        </>
      )}

      {/* Model Details Panel */}
      {selectedModel && (
        <Suspense fallback={<Spinner />}>
          <ModelDetails
            model={selectedModel}
            systemInfo={systemInfo}
            isActive={selectedModel?.isActive}
            onDownload={handleDownload}
            onActivate={(id) => console.log('Activating model:', id)}
            onDelete={() => {
              if (window.confirm(`Are you sure you want to delete ${selectedModel.name || selectedModel.id}?`)) {
                deleteModel(selectedModel.id || selectedModel._id)
                  .then(() => {
                    loadInstalledModels();
                    setSelectedModel(null);
                  })
                  .catch(err => setError(`❌ Failed to delete model: ${err.message}`));
              }
            }}
            onBack={() => setSelectedModel(null)}
            onFavorite={handleToggleFavorite}
            isFavorite={favoriteModels.includes(selectedModel.id)}
          />
        </Suspense>
      )}

      {/* Filters Panel */}
      <FiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <ModelDownloader />
    </div>
  );
}

// Helper Components
function TabButton({ isActive, onClick, children }) {
  return (
    <motion.button 
      className={`px-4 py-2 font-medium text-sm flex items-center ${
        isActive 
          ? 'text-blue-400 border-b-2 border-blue-400' 
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
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
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
