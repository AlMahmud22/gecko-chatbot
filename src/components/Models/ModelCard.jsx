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
      {/* HuggingFace logo in top right corner if it's from HF */}
      {model.id?.includes('/') && !model?.isInstalled && (
        <div className="absolute top-4 right-4 z-10 opacity-60 group-hover:opacity-80 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 95 88" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M29.2269 83.2484C26.8889 83.2484 24.7579 82.3232 23.199 80.7494C21.6548 79.1755 20.7379 77.0222 20.7379 74.6558V49.2789H29.3453V74.6558C29.3453 74.9385 29.4636 75.2359 29.7003 75.4477C29.9223 75.6742 30.2324 75.7929 30.5426 75.7929C30.8527 75.7929 31.1629 75.6742 31.3849 75.4477C31.6216 75.2359 31.7399 74.9385 31.7399 74.6558V27.1338C31.7399 24.7822 32.6715 22.6289 34.201 21.0403C35.7599 19.4664 37.8909 18.5412 40.2143 18.5412C42.5524 18.5412 44.6834 19.4664 46.2423 21.0403C47.7865 22.6289 48.7034 24.7674 48.7034 27.1338V48.0264H40.0963V27.1338C40.0963 26.8511 39.978 26.5537 39.7413 26.342C39.5193 26.1154 39.2092 25.9967 38.899 25.9967C38.5889 25.9967 38.2788 26.1154 38.0568 26.342C37.8201 26.5537 37.7018 26.8511 37.7018 27.1338V74.6558C37.7018 77.0074 36.7701 79.1608 35.2406 80.7494C33.6818 82.3232 31.5508 83.2484 29.2274 83.2484H29.2269Z" fill="white"/>
            <path d="M67.5003 83.2336C62.7542 83.2336 58.9526 79.4605 58.9526 74.6867V27.1338C58.9526 22.36 62.7542 18.5869 67.5003 18.5869C72.2464 18.5869 76.048 22.36 76.048 27.1338V48.0264H67.4856V74.6867C67.4856 74.9693 67.3673 75.2667 67.1306 75.4785C66.9086 75.705 66.5985 75.8237 66.2883 75.8237C65.9782 75.8237 65.6681 75.705 65.4461 75.4785C65.2094 75.2667 65.0911 74.9693 65.0911 74.6867V49.2789H76.048V74.6867C76.048 79.4605 72.2464 83.2336 67.5003 83.2336ZM67.5003 40.5784H67.4856V27.1338C67.4856 26.8511 67.3673 26.5537 67.1306 26.342C66.9086 26.1154 66.5985 25.9967 66.2883 25.9967C65.9782 25.9967 65.6681 26.1154 65.4461 26.342C65.2094 26.5537 65.0911 26.8511 65.0911 27.1338V40.5784H67.5003Z" fill="white"/>
            <path d="M7.24773 65.4994C3.17086 65.4994 0 62.3286 0 58.2517V33.4649C0 29.3881 3.17086 26.2172 7.24773 26.2172C11.3246 26.2172 14.4955 29.3881 14.4955 33.4649V58.2517C14.4955 62.3286 11.3246 65.4994 7.24773 65.4994ZM7.24773 33.6736C7.24773 33.6736 7.24773 33.6736 7.24773 33.6736C7.24773 33.6736 7.24773 33.6736 7.24773 33.6736Z" fill="white"/>
            <path d="M7.24773 20.2512C3.30473 20.2512 0 16.9465 0 12.9888C0 9.0459 3.30473 5.72632 7.24773 5.72632C11.1907 5.72632 14.4955 9.0459 14.4955 12.9888C14.4955 16.9465 11.1907 20.2512 7.24773 20.2512Z" fill="white"/>
            <path d="M87.7523 65.4994C83.6754 65.4994 80.5045 62.3286 80.5045 58.2517V33.4649C80.5045 29.3881 83.6754 26.2172 87.7523 26.2172C91.8292 26.2172 95.0001 29.3881 95.0001 33.4649V58.2517C95.0001 62.3286 91.8292 65.4994 87.7523 65.4994ZM87.7523 33.6736C87.7523 33.6736 87.7523 33.6736 87.7523 33.6736C87.7523 33.6736 87.7523 33.6736 87.7523 33.6736Z" fill="white"/>
            <path d="M87.7523 20.2512C83.8093 20.2512 80.5045 16.9465 80.5045 12.9888C80.5045 9.0459 83.8093 5.72632 87.7523 5.72632C91.6953 5.72632 95 9.0459 95 12.9888C95 16.9465 91.6953 20.2512 87.7523 20.2512Z" fill="white"/>
            <path d="M48.3295 83.2041C44.2526 83.2041 41.0818 80.0333 41.0818 75.9564V65.0185C41.0818 60.9416 44.2526 57.7708 48.3295 57.7708C52.4064 57.7708 55.5773 60.9416 55.5773 65.0185V75.9564C55.5773 80.0333 52.4064 83.2041 48.3295 83.2041ZM48.3295 65.2272C48.3295 65.2272 48.3295 65.2272 48.3295 65.2272C48.3295 65.2272 48.3295 65.2272 48.3295 65.2272Z" fill="white"/>
          </svg>
        </div>
      )}
      
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
