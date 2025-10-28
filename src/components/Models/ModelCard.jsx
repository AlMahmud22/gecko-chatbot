import { 
  CheckCircleIcon, 
  TrashIcon, 
  PlayCircleIcon,
  ArrowDownTrayIcon,
  StarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

function ModelCard({ model, systemInfo, isActive, onActivate, onDeactivate, onDelete, onClick }) {
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
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
  
  // Extract info from model filename or metadata
  const extractModelInfo = () => {
    const fileName = model.name || model.id || 'unknown';
    const lowerName = fileName.toLowerCase();
    
    // Extract quantization (Q4_K_M, Q5_K_S, etc.)
    const quantMatch = fileName.match(/[Qq](\d+)[_-]?([KkMm])?[_-]?([SsMmLl])?/);
    const quant = quantMatch ? fileName.substring(quantMatch.index, quantMatch.index + quantMatch[0].length) : null;
    
    // Extract parameter count (7B, 13B, 70B, etc.)
    const paramMatch = fileName.match(/(\d+\.?\d*)[Bb]/);
    const parameters = paramMatch ? paramMatch[0] : null;
    
    // Extract model family/name (first part before version/quant info)
    const nameParts = fileName.replace('.gguf', '').split(/[-_]/);
    const modelFamily = nameParts[0] || 'Unknown Model';
    
    return { quant, parameters, modelFamily };
  };
  
  const { quant, parameters, modelFamily } = extractModelInfo();
  
  // Extract author/username from model name or use first letter
  const author = model.author || modelFamily.split('-')[0] || 'Unknown';
  const displayName = model.displayName || model.name || model.id || 'Unnamed Model';

  return (
    <motion.div
      className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-5 flex flex-col space-y-4 cursor-pointer hover:border-green-600 hover:shadow-lg transition-all relative group"
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full mr-3 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {author[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold text-base truncate leading-tight" title={displayName}>
              {displayName}
            </h3>
            <p className="text-sm text-gray-400 truncate">{author}</p>
          </div>
        </div>
        
        {/* Active/Inactive status indicator */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {model.isExternal && (
            <span className="bg-orange-500 bg-opacity-20 border border-orange-500 rounded-full px-2 py-1 text-xs text-orange-400 font-medium flex items-center mr-2" title="External model - linked from another location">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              External
            </span>
          )}
          {model.isActive || model.active ? (
            <span className="bg-green-500 bg-opacity-20 border border-green-500 rounded-full px-2 py-1 text-xs text-green-500 font-medium flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-1" />
              Active
            </span>
          ) : (
            <span className="bg-gray-500 bg-opacity-20 border border-gray-500 rounded-full px-2 py-1 text-xs text-gray-400 font-medium">
              Inactive
            </span>
          )}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
        {model?.description || `${model.isExternal ? 'External' : 'Local'} GGUF model${parameters ? ` with ${parameters} parameters` : ''}${quant ? ` (${quant} quantization)` : ''}`}
      </p>
      
      {/* External path info */}
      {model.isExternal && model.externalPath && (
        <div className="text-xs text-gray-500 truncate">
          <span className="font-semibold">Path: </span>
          <code className="bg-[#1a1a1a] px-1 py-0.5 rounded">{model.externalPath}</code>
        </div>
      )}
      
      {/* Tags and metadata */}
      <div className="flex flex-wrap gap-2">
        {/* Parameters tag */}
        {parameters && (
          <span className="px-2 py-1 bg-green-600 bg-opacity-20 border border-green-600 text-green-400 text-xs rounded-full font-medium flex items-center">
            <CpuChipIcon className="w-3 h-3 mr-1" />
            {parameters}
          </span>
        )}
        
        {/* Quantization tag */}
        {(quant || model.quant) && (
          <span className="px-2 py-1 bg-purple-500 bg-opacity-20 border border-purple-500 text-purple-300 text-xs rounded-full font-medium">
            {quant || model.quant}
          </span>
        )}
        
        {/* Pipeline tag */}
        {model.pipeline_tag && (
          <span className="px-2 py-1 bg-purple-500 bg-opacity-20 border border-purple-500 text-purple-300 text-xs rounded-full font-medium">
            {model.pipeline_tag.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        )}
        
        {/* Library tag */}
        {model.library_name && (
          <span className="px-2 py-1 bg-green-600 bg-opacity-20 border border-green-600 text-green-400 text-xs rounded-full font-medium">
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
      <div className="flex gap-2 pt-4 border-t border-[#3a3a3a]">
        {(model.isActive || model.active) ? (
          <motion.button
            className="flex-1 min-w-0 px-2 py-2 bg-orange-600 text-white text-xs sm:text-sm rounded-lg hover:bg-orange-700 transition-all flex items-center justify-center font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate && onDeactivate(model.id);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Deactivate</span>
          </motion.button>
        ) : (
          <motion.button
            className="flex-1 min-w-0 px-2 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-all flex items-center justify-center font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onActivate && onActivate(model.id);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlayCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Activate</span>
          </motion.button>
        )}
        
        {onDelete && (
          <motion.button
            className="flex-shrink-0 px-2 sm:px-3 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(model.id);
            }}
            title={model.isExternal ? "Unlink from app (file will not be deleted from your computer)" : "Delete this model permanently"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="truncate hidden xs:inline">{model.isExternal ? 'Unlink' : 'Remove'}</span>
            <span className="truncate xs:hidden">{model.isExternal ? 'Unlink' : 'Del'}</span>
          </motion.button>
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
    isActive: PropTypes.bool,
  }).isRequired,
  systemInfo: PropTypes.object,
  isActive: PropTypes.bool,
  onActivate: PropTypes.func,
  onDeactivate: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
};

export default ModelCard;
