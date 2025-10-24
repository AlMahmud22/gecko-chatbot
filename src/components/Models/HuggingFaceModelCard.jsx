import React from 'react';
import { motion } from 'framer-motion';
import { 
  StarIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  TagIcon,
  HeartIcon,
  PlayCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid 
} from '@heroicons/react/24/solid';

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return 'Unknown';
  }
}

function getLibraryBadgeColor(library) {
  const colors = {
    'transformers': 'bg-yellow-500',
    'pytorch': 'bg-orange-500',
    'tensorflow': 'bg-orange-600',
    'jax': 'bg-purple-500',
    'gguf': 'bg-green-500',
    'safetensors': 'bg-blue-500',
    'onnx': 'bg-gray-500',
    'tensorrt-llm': 'bg-green-600'
  };
  return colors[library?.toLowerCase()] || 'bg-gray-500';
}

function HuggingFaceModelCard({ 
  model, 
  onClick, 
  onDownload, 
  onFavorite, 
  isFavorite = false,
  isDownloading = false,
  isInstalled = false 
}) {
  const handleCardClick = (e) => {
    e.preventDefault();
    onClick?.(model);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload?.(model);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavorite?.(model);
  };

  // Extract model size from tags or model name
  const getModelSize = () => {
    const sizeRegex = /(\d+\.?\d*)\s*([BM])/i;
    const nameMatch = model.id?.match(sizeRegex);
    const tagMatch = model.tags?.find(tag => sizeRegex.test(tag));
    
    if (nameMatch) return nameMatch[0];
    if (tagMatch) return tagMatch.match(sizeRegex)?.[0];
    return null;
  };

  const modelSize = getModelSize();
  const libraries = model.tags?.filter(tag => 
    ['transformers', 'pytorch', 'tensorflow', 'jax', 'gguf', 'safetensors', 'onnx'].includes(tag.toLowerCase())
  ).slice(0, 3) || [];

  return (
    <motion.div
      className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate" title={model.id}>
              {model.id}
            </h3>
            {model.author && (
              <p className="text-gray-400 text-xs mt-1">by {model.author}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? (
                <HeartIconSolid className="w-4 h-4 text-red-500" />
              ) : (
                <HeartIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
              )}
            </button>
            
            {/* Status Icons */}
            {isInstalled && (
              <CheckCircleIcon className="w-4 h-4 text-green-500" title="Installed" />
            )}
          </div>
        </div>

        {/* Description */}
        {model.description && (
          <p className="text-gray-300 text-xs leading-relaxed line-clamp-2 mb-3">
            {model.description}
          </p>
        )}

        {/* Model Size */}
        {modelSize && (
          <div className="flex items-center mb-2">
            <TagIcon className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-gray-400 text-xs">{modelSize} parameters</span>
          </div>
        )}

        {/* Library Badges */}
        {libraries.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {libraries.map(library => (
              <span
                key={library}
                className={`px-2 py-0.5 rounded-full text-white text-xs font-medium ${getLibraryBadgeColor(library)}`}
              >
                {library}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-3">
            {/* Stars */}
            <div className="flex items-center space-x-1">
              <StarIcon className="w-3 h-3" />
              <span>{formatNumber(model.likes || 0)}</span>
            </div>
            
            {/* Downloads */}
            <div className="flex items-center space-x-1">
              <ArrowDownTrayIcon className="w-3 h-3" />
              <span>{formatNumber(model.downloads || 0)}</span>
            </div>
          </div>
          
          {/* Last Updated */}
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-3 h-3" />
            <span>{formatDate(model.lastModified)}</span>
          </div>
        </div>
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="px-4 py-3 bg-gray-750 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          {isInstalled ? (
            <button
              onClick={handleCardClick}
              className="flex-1 flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
            >
              <PlayCircleIcon className="w-3 h-3 mr-1" />
              Use Model
            </button>
          ) : (
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
            >
              {isDownloading ? (
                <>
                  <div className="w-3 h-3 border border-transparent border-t-white rounded-full animate-spin mr-1" />
                  Downloading...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                  Download
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleCardClick}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs font-medium rounded transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default HuggingFaceModelCard;
