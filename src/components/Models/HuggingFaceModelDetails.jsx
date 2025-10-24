import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  StarIcon,
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function formatBytes(bytes) {
  if (!bytes) return 'Unknown size';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Unknown';
  }
}

function HuggingFaceModelDetails({ 
  model, 
  isOpen, 
  onClose, 
  onDownload, 
  onFavorite, 
  isFavorite = false,
  isDownloading = false,
  isInstalled = false,
  modelFiles = []
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [modelDetails, setModelDetails] = useState(null);

  // Load detailed model information when modal opens
  useEffect(() => {
    if (isOpen && model && !modelDetails) {
      loadModelDetails();
    }
  }, [isOpen, model]);

  const loadModelDetails = async () => {
    if (!model?.id) return;
    
    setIsLoadingDetails(true);
    try {
      // Simulate API call to get detailed model info
      // In real implementation, this would fetch from HuggingFace API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const details = {
        readme: `# ${model.id}\n\nThis is a detailed description of the model...`,
        config: model.config || {},
        architecture: model.pipeline_tag || 'text-generation',
        framework: model.tags?.find(tag => ['pytorch', 'tensorflow', 'jax'].includes(tag.toLowerCase())) || 'pytorch',
        language: model.tags?.find(tag => ['en', 'multilingual'].includes(tag.toLowerCase())) || 'en',
        license: model.tags?.find(tag => tag.includes('license')) || 'apache-2.0',
        size: model.safetensors?.total || 0
      };
      
      setModelDetails(details);
    } catch (error) {
      console.error('Failed to load model details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDownload = () => {
    onDownload?.(model);
  };

  const handleFavorite = () => {
    onFavorite?.(model);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
    { id: 'files', label: 'Files and versions', icon: CodeBracketIcon },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Model Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-400">Likes</span>
          </div>
          <span className="text-xl font-semibold text-white">{formatNumber(model.likes || 0)}</span>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ArrowDownTrayIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-400">Downloads</span>
          </div>
          <span className="text-xl font-semibold text-white">{formatNumber(model.downloads || 0)}</span>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-400">Updated</span>
          </div>
          <span className="text-xs text-white">{formatDate(model.lastModified)}</span>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TagIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-400">Size</span>
          </div>
          <span className="text-xs text-white">{formatBytes(modelDetails?.size)}</span>
        </div>
      </div>

      {/* Model Description */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed">
            {model.description || 'No description available for this model.'}
          </p>
        </div>
      </div>

      {/* Model Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Model Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Architecture:</span>
              <span className="text-white">{modelDetails?.architecture || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Framework:</span>
              <span className="text-white">{modelDetails?.framework || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Language:</span>
              <span className="text-white">{modelDetails?.language || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">License:</span>
              <span className="text-white">{modelDetails?.license || 'Unknown'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {model.tags?.slice(0, 10).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* README Content */}
      {modelDetails?.readme && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">README</h3>
          <div className="prose prose-invert max-w-none">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {modelDetails.readme}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Model Files</h3>
        {modelFiles.length > 0 ? (
          <div className="space-y-2">
            {modelFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CodeBracketIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-white text-sm">{file.path || file.name}</span>
                </div>
                <span className="text-gray-400 text-sm">{formatBytes(file.size)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CodeBracketIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No files information available</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-gray-900 border-l border-gray-700 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-white truncate">{model?.id}</h2>
                {model?.author && (
                  <p className="text-gray-400 text-sm mt-1">by {model.author}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {/* Action Buttons */}
                <button
                  onClick={handleFavorite}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite ? (
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
                  )}
                </button>
                
                {isInstalled ? (
                  <div className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Installed
                  </div>
                ) : (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border border-transparent border-t-white rounded-full animate-spin mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border border-gray-600 border-t-blue-500 rounded-full animate-spin mr-3" />
                  <span className="text-gray-400">Loading model details...</span>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && renderOverviewTab()}
                  {activeTab === 'files' && renderFilesTab()}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default HuggingFaceModelDetails;
