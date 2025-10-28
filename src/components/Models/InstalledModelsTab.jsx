import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FolderIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import ModelCard from './ModelCard';
import Spinner from '../Common/Spinner';

/**
 * Dedicated component for displaying installed models
 * Handles local model management and displays models stored in ./models/ folder
 */
function InstalledModelsTab({ 
  installedModels, 
  systemInfo, 
  selectedModel, 
  onModelClick, 
  onDelete, 
  onFavorite, 
  favoriteModels, 
  onAddLocalModel, 
  isLocalModelLoading 
}) {
  return (
    <div className="space-y-6">
      {installedModels.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
        >
          {installedModels.map((model) => (
            <motion.div
              key={model.id || model._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ModelCard
                model={{
                  ...model, 
                  id: model.id || model._id,
                  name: model.name || model.id?.split('/').pop() || 'Unnamed Model',
                  isInstalled: true
                }}
                systemInfo={systemInfo}
                isActive={selectedModel?.id === (model.id || model._id)}
                onClick={() => onModelClick(model)}
                onDownload={null} // No download for installed models
                onDelete={() => {
                  if (window.confirm(`Are you sure you want to delete ${model.name || 'this model'}?`)) {
                    onDelete(model.id || model._id);
                  }
                }}
                onFavorite={() => onFavorite(model.id || model._id)}
                isFavorite={favoriteModels.includes(model.id || model._id)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyInstalledState 
          onAddLocalModel={onAddLocalModel}
          isLocalModelLoading={isLocalModelLoading}
        />
      )}
    </div>
  );
}

/**
 * Empty state component for when no models are installed
 */
function EmptyInstalledState({ onAddLocalModel, isLocalModelLoading }) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <FolderIcon className="w-16 h-16 text-gray-500 mb-4" />
      <h3 className="text-white text-xl font-semibold mb-2">No installed models yet</h3>
      <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
        Get started by adding models to your local library. You can add models locally 
        from your computer or download them from the "All Models" tab.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          className="flex items-center px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-all shadow-lg"
          onClick={onAddLocalModel}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          disabled={isLocalModelLoading}
        >
          {isLocalModelLoading ? (
            <Spinner className="w-5 h-5 mr-2" />
          ) : (
            <PlusCircleIcon className="w-5 h-5 mr-2" />
          )}
          Add Model Locally
        </motion.button>
        
        <motion.button
          className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          onClick={() => {
            // Switch to all models tab - this should be handled by parent
            window.dispatchEvent(new CustomEvent('switchToAllModels'));
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Browse All Models
        </motion.button>
      </div>
      
      <div className="mt-8 p-4 bg-green-600 bg-opacity-10 border border-green-600 border-opacity-30 rounded-lg max-w-lg">
        <p className="text-green-500 text-sm">
          💡 <strong>Pro tip:</strong> Installed models run locally on your machine, 
          giving you privacy and offline capabilities. GGUF format models work best for local inference.
        </p>
      </div>
    </motion.div>
  );
}

InstalledModelsTab.propTypes = {
  installedModels: PropTypes.array.isRequired,
  systemInfo: PropTypes.object,
  selectedModel: PropTypes.object,
  onModelClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onFavorite: PropTypes.func.isRequired,
  favoriteModels: PropTypes.array.isRequired,
  onAddLocalModel: PropTypes.func.isRequired,
  isLocalModelLoading: PropTypes.bool.isRequired,
};

EmptyInstalledState.propTypes = {
  onAddLocalModel: PropTypes.func.isRequired,
  isLocalModelLoading: PropTypes.bool.isRequired,
};

export default InstalledModelsTab;
