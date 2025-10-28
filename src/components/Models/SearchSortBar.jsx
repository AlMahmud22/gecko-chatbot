import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import DebouncedSearchInput from './DebouncedSearchInput';

function SearchSortBar({ 
  searchQuery, 
  onSearch, 
  sortBy, 
  onSortChange, 
  onToggleFilters,
  showFilters,
  isLoading
}) {
  const sortOptions = [
    { value: 'downloads', label: 'Most Downloads' },
    { value: 'trending', label: 'Trending' },
    { value: 'lastModified', label: 'Recently Updated' }
  ];

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex space-x-3">
        <div className="relative flex-grow">
          <DebouncedSearchInput
            value={searchQuery}
            onChange={(value) => onSearch(value)}
            onSearch={(value) => {
              console.log('Search triggered with:', value);
              onSearch(value);
            }}
            placeholder="Search models..."
            isLoading={isLoading}
          />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg py-2 px-4 pr-8 text-gray-200 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 cursor-pointer"
            disabled={isLoading}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Filter button clicked');
            onToggleFilters();
          }}
          className={`flex items-center justify-center bg-[#2a2a2a] border ${showFilters ? 'border-green-600 text-green-600' : 'border-[#3a3a3a] text-gray-300'} rounded-lg px-4 py-2 hover:border-green-600 hover:text-green-500 transition-colors`}
          disabled={isLoading}
          type="button"
        >
          <FunnelIcon className="w-5 h-5 mr-2" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
}

SearchSortBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onToggleFilters: PropTypes.func.isRequired,
  showFilters: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool
};

export default SearchSortBar;
