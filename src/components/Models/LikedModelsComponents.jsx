import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';

/**
 * LikedModelTab component displays a tabbed interface for toggling between
 * all models and liked models
 */
function LikedModelTabs({ activeTab, onTabChange, favoriteCount }) {
  return (
    <div className="flex mb-6 border-b border-gray-700">
      <button 
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === 'all' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => onTabChange('all')}
      >
        All Models
      </button>
      <button 
        className={`px-4 py-2 font-medium text-sm flex items-center ${
          activeTab === 'liked' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => onTabChange('liked')}
      >
        Liked Models
        {favoriteCount > 0 && (
          <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
            {favoriteCount}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * EmptyLikedModels displays a friendly message when no models are liked
 */
function EmptyLikedModels() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <HeartIcon className="w-16 h-16 text-gray-500 mb-4" />
      <h3 className="text-white text-lg font-medium mb-2">No liked models yet</h3>
      <p className="text-gray-400 max-w-md">
        Click the heart icon on any model to add it to your liked models for easy access later.
      </p>
    </div>
  );
}

/**
 * FavoriteButton displays a heart icon that can be clicked to favorite/unfavorite a model
 */
function FavoriteButton({ isFavorite, onToggle, className = '' }) {
  return (
    <button 
      onClick={onToggle}
      className={`text-gray-400 hover:text-red-500 transition-colors ${className}`}
      title={isFavorite ? "Remove from liked models" : "Add to liked models"}
    >
      {isFavorite ? (
        <HeartSolidIcon className="w-5 h-5 text-red-500" />
      ) : (
        <HeartIcon className="w-5 h-5" />
      )}
    </button>
  );
}

LikedModelTabs.propTypes = {
  activeTab: PropTypes.oneOf(['all', 'liked']).isRequired,
  onTabChange: PropTypes.func.isRequired,
  favoriteCount: PropTypes.number.isRequired
};

FavoriteButton.propTypes = {
  isFavorite: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  className: PropTypes.string
};

export { LikedModelTabs, EmptyLikedModels, FavoriteButton };
