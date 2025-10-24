import { CheckCircleIcon, TrashIcon, PlayCircleIcon, HeartIcon, ArrowDownTrayIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

function ModelCard({ model, systemInfo, isActive, onDownload, onActivate, onDelete, onClick, onFavorite, isFavorite }) {
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
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
  
  // Extract username from repo_id (username/repo-name)
  const author = model.id?.split('/')[0] || 'Unknown';
  const modelName = model.name || model.id?.split('/').pop() || model.modelId || 'Unnamed Model';

  return (
    <motion.div
      className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-5 flex flex-col space-y-4 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all relative group"
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header with author info and actions */}
      <div className="flex justify-between items-start">
        <div className="flex items-center min-w-0 flex-1 pr-4">
          {model.avatar_url ? (
            <img 
              src={model.avatar_url} 
              alt={author} 
              className="w-10 h-10 rounded-full mr-3 flex-shrink-0 border-2 border-gray-600"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-3 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {author[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold text-base truncate leading-tight">
              {modelName}
            </h3>
            <p className="text-sm text-gray-400 truncate">{author}</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Favorite button */}
          {onFavorite && model?.id && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(model.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-500 hover:bg-opacity-10"
              title={isFavorite ? "Remove from liked models" : "Add to liked models"}
            >
              {isFavorite ? (
                <HeartSolidIcon className="w-4 h-4 text-red-500" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Installed indicator */}
          {model?.isInstalled && (
            <div className="flex items-center">
              <span className="bg-green-500 bg-opacity-20 border border-green-500 rounded-full px-2 py-1 text-xs text-green-500 font-medium flex items-center">
                <CheckCircleIcon className="w-3 h-3 text-green-500 mr-1" />
                Installed
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
        {model?.description || 'No description available'}
      </p>
      
      {/* Tags and metadata */}
      <div className="flex flex-wrap gap-2">
        {/* Pipeline tag */}
        {model.pipeline_tag && (
          <span className="px-2 py-1 bg-purple-500 bg-opacity-20 border border-purple-500 text-purple-300 text-xs rounded-full font-medium">
            {model.pipeline_tag.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        )}
        
        {/* Library tag */}
        {model.library_name && (
          <span className="px-2 py-1 bg-blue-500 bg-opacity-20 border border-blue-500 text-blue-300 text-xs rounded-full font-medium">
            {model.library_name}
          </span>
        )}
        
        {/* Parameter count */}
        {model.parameters && model.parameters !== 'Unknown' && (
          <span className="px-2 py-1 bg-green-500 bg-opacity-20 border border-green-500 text-green-300 text-xs rounded-full font-medium">
            {model.parameters}
          </span>
        )}
        
        {/* Quantization */}
        {model.quant && model.quant !== 'Unknown' && (
          <span className="px-2 py-1 bg-orange-500 bg-opacity-20 border border-orange-500 text-orange-300 text-xs rounded-full font-medium">
            {model.quant}
          </span>
        )}
      </div>
      
      {/* Model stats */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Size:</span>
          <span className="text-gray-300 font-medium">{formatSize(model.size)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">License:</span>
          <span className="text-gray-300 font-medium">{model.license || 'Unknown'}</span>
        </div>
        
        {/* Downloads and likes */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center text-gray-500">
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            <span className="text-sm">{typeof model.downloads === 'number' ? model.downloads.toLocaleString() : 'N/A'}</span>
          </div>
          {typeof model.likes === 'number' && model.likes > 0 && (
            <div className="flex items-center text-gray-500">
              <StarIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">{model.likes.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {/* Timestamps */}
        {(model.lastModified || model.downloadedAt) && (
          <div className="text-xs text-gray-500 pt-1 border-t border-gray-700">
            {model.lastModified && (
              <div>Updated: {formatDate(model.lastModified)}</div>
            )}
            {model.downloadedAt && (
              <div>Installed: {formatDate(model.downloadedAt)}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Action buttons footer */}
      <div className="flex space-x-2 pt-4 border-t border-[#3a3a3a]">
        {!model.isInstalled && onDownload && (
          <motion.button
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(model.id, `${modelName}.Q4_K_M.gguf`); // Default quant
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            <span>Download</span>
          </motion.button>
        )}
        
        {model.isInstalled && (
          <div className="flex space-x-2 w-full">
            <button
              className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                window.electronAPI?.openModelsFolder();
              }}
              title="Open models folder"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              <span>Open</span>
            </button>
            {onDelete && (
              <button
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete this model"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
        
        {!isActive && model.isInstalled && onActivate && (
          <button
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              onActivate(model.id);
            }}
          >
            <PlayCircleIcon className="w-4 h-4 mr-2" />
            <span>Activate</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

ModelCard.propTypes = {
  model: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    modelId: PropTypes.string,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    quant: PropTypes.string,
    parameters: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    license: PropTypes.string,
    downloads: PropTypes.number,
    likes: PropTypes.number,
    library_name: PropTypes.string,
    pipeline_tag: PropTypes.string,
    avatar_url: PropTypes.string,
    lastModified: PropTypes.string,
    downloadedAt: PropTypes.string,
    isInstalled: PropTypes.bool,
  }).isRequired,
  systemInfo: PropTypes.object,
  isActive: PropTypes.bool,
  onDownload: PropTypes.func,
  onActivate: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
  onFavorite: PropTypes.func,
  isFavorite: PropTypes.bool,
};

export default ModelCard;
