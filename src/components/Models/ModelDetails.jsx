import React, { useState } from 'react';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  TrashIcon, 
  PlayCircleIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  DocumentTextIcon,
  TagIcon,
  ScaleIcon,
  CalendarIcon,
  XMarkIcon,
  StarIcon,
  FolderOpenIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

function ModelDetails({ model, systemInfo, isActive, onDownload, onActivate, onDelete, onBack, onFavorite, isFavorite }) {
  const [activeTab, setActiveTab] = useState('readme');
  
  const formatSize = (bytes) => {
    if (!bytes || isNaN(Number(bytes))) return 'Unknown';
    const size = Number(bytes);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = size;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Extract username from repo_id (username/repo-name)
  const author = model.id?.split('/')[0] || 'Unknown';
  const modelName = model.name || model.id?.split('/').pop() || 'Unnamed Model';

  const tabs = [
    { id: 'readme', label: 'Model Card', icon: DocumentTextIcon },
    { id: 'files', label: 'Files', icon: FolderOpenIcon },
    { id: 'details', label: 'Details', icon: TagIcon },
  ];

  return (
    <motion.div 
      className="fixed top-0 right-0 bottom-0 w-1/2 lg:w-2/5 xl:w-1/3 bg-[#1a1a1a] overflow-hidden shadow-2xl z-50 border-l border-gray-800 flex flex-col"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-[#2a2a2a] p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            className="flex items-center text-gray-400 hover:text-white transition-colors"
            onClick={onBack}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to models
          </button>
          
          <div className="flex items-center space-x-2">
            {onFavorite && (
              <button 
                className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                onClick={() => onFavorite(model.id)}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <HeartSolidIcon className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </button>
            )}
            
            <button
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
              onClick={onBack}
              title="Close panel"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Model header */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {model.avatar_url ? (
            <img 
              src={model.avatar_url} 
              alt={author} 
              className="w-16 h-16 rounded-lg border-2 border-gray-700"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-xl border-2 border-gray-700">
              {author[0]?.toUpperCase()}
            </div>
          )}
          
          {/* Model info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-1 truncate">
              {modelName}
            </h1>
            <p className="text-gray-400 text-sm mb-2">by {author}</p>
            
            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {typeof model.downloads === 'number' && model.downloads > 0 && (
                <div className="flex items-center">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  {model.downloads.toLocaleString()}
                </div>
              )}
              {typeof model.likes === 'number' && model.likes > 0 && (
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 mr-1" />
                  {model.likes.toLocaleString()}
                </div>
              )}
              {model.lastModified && (
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Updated {formatDate(model.lastModified)}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {!model.isInstalled && onDownload && (
            <motion.button
              className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
              onClick={() => onDownload(model.id, `${modelName}.Q4_K_M.gguf`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Download
            </motion.button>
          )}
          
          {model.isInstalled && (
            <>
              {!isActive && onActivate && (
                <motion.button
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  onClick={() => onActivate(model.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PlayCircleIcon className="w-4 h-4 mr-2" />
                  Activate
                </motion.button>
              )}
              
              {onDelete && (
                <button
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  onClick={onDelete}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </>
          )}
          
          {model.isInstalled && isActive && (
            <div className="flex items-center px-4 py-2 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg text-green-400">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Active
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mt-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'readme' && (
              <motion.div
                key="readme"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Model Card</h3>
                <div className="prose prose-invert max-w-none">
                  {model.description ? (
                    <div className="text-gray-300 leading-relaxed">
                      <p>{model.description}</p>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">
                      No model card available for this model.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Files</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-[#2a2a2a] rounded-lg border border-gray-700">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-gray-300 font-mono text-sm">
                        {modelName}.gguf
                      </span>
                      <span className="ml-auto text-gray-500 text-sm">
                        {formatSize(model.size)}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm mt-4">
                    💡 This model is available in GGUF format for local inference.
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Model Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <DetailItem label="Parameters" value={model.parameters || 'Unknown'} />
                    <DetailItem label="Quantization" value={model.quant || 'N/A'} />
                    <DetailItem label="Pipeline Tag" value={model.pipeline_tag || 'N/A'} />
                    <DetailItem label="Library" value={model.library_name || 'N/A'} />
                    <DetailItem label="License" value={model.license || 'Unknown'} />
                    <DetailItem label="Size" value={formatSize(model.size)} />
                  </div>
                  
                  {/* Tags */}
                  {model.tags && model.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {model.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-[#2a2a2a] text-gray-300 text-xs rounded border border-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Helper component for detail items
function DetailItem({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

ModelDetails.propTypes = {
  model: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    downloads: PropTypes.number,
    likes: PropTypes.number,
    lastModified: PropTypes.string,
    parameters: PropTypes.string,
    quant: PropTypes.string,
    pipeline_tag: PropTypes.string,
    library_name: PropTypes.string,
    license: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    avatar_url: PropTypes.string,
    isInstalled: PropTypes.bool,
  }).isRequired,
  systemInfo: PropTypes.object,
  isActive: PropTypes.bool,
  onDownload: PropTypes.func,
  onActivate: PropTypes.func,
  onDelete: PropTypes.func,
  onBack: PropTypes.func.isRequired,
  onFavorite: PropTypes.func,
  isFavorite: PropTypes.bool,
};

export default ModelDetails;
