import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Enhanced Search Input component with HuggingFace-like UX:
 * - No auto-debounce on typing
 * - Search triggers only on ENTER key or search button click
 * - Visual feedback with search icon and loading states
 * - Clear button functionality
 */
function DebouncedSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search models...",
  className = "",
  isLoading = false
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  // Handle input change (just updates the value, no search)
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };
  
  // Handle Enter key to perform search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        onSearch(value.trim());
      } else {
        // If empty search, trigger a search with empty string to reset
        onSearch('');
      }
    }
  };
  
  // Clear search field
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    onSearch(''); // Trigger search with empty string to show all models
    inputRef.current?.focus(); // Keep focus after clearing
  };
  
  // Execute search explicitly via button
  const handleSearchClick = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    } else {
      onSearch(''); // Show all models if search is empty
    }
  };
  
  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search Icon */}
      <MagnifyingGlassIcon 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" 
      />
      
      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={`w-full pl-10 pr-20 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white 
          focus:outline-none transition-all duration-200 ${
            isFocused || value 
              ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' 
              : 'hover:border-gray-600'
          }`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={isLoading}
      />
      
      {/* Clear button - appears when there is text */}
      {value && !isLoading && (
        <button
          className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded"
          onClick={handleClear}
          disabled={isLoading}
          aria-label="Clear search"
          title="Clear search"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
      
      {/* Search button */}
      <button
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-400 transition-colors p-1 rounded disabled:opacity-50"
        onClick={handleSearchClick}
        disabled={isLoading}
        aria-label="Search"
        title="Search (or press Enter)"
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <MagnifyingGlassIcon className="h-4 w-4" />
        )}
      </button>
      
      {/* Search hint */}
      {isFocused && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 z-10">
          💡 Press <kbd className="bg-gray-700 px-1 rounded text-gray-300">Enter</kbd> to search or click the search icon
        </div>
      )}
    </div>
  );
}
DebouncedSearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  isLoading: PropTypes.bool
};

export default DebouncedSearchInput;
