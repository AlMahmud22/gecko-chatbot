import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

/**
 * HuggingFace-style filter panel component
 * Provides advanced filtering options matching HF's UI design
 */
function FiltersPanel({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange,
  onApply,
  onClear 
}) {
  const [expandedSections, setExpandedSections] = useState({
    task: true,
    library: true,
    size: true,
    license: false,
    language: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (category, value, checked) => {
    const currentValues = filters[category] || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onFiltersChange({
      ...filters,
      [category]: newValues
    });
  };

  const handleSingleFilterChange = (category, value) => {
    onFiltersChange({
      ...filters,
      [category]: value
    });
  };

  const isFilterActive = (category, value) => {
    const currentValues = filters[category];
    return Array.isArray(currentValues) ? currentValues.includes(value) : currentValues === value;
  };

  const taskOptions = [
    { value: 'text-generation', label: 'Text Generation', count: 15420 },
    { value: 'conversational', label: 'Conversational', count: 2156 },
    { value: 'text-classification', label: 'Text Classification', count: 1834 },
    { value: 'question-answering', label: 'Question Answering', count: 1203 },
    { value: 'summarization', label: 'Summarization', count: 892 },
  ];

  const libraryOptions = [
    { value: 'transformers', label: 'Transformers', count: 12453 },
    { value: 'pytorch', label: 'PyTorch', count: 8921 },
    { value: 'gguf', label: 'GGUF', count: 4567 },
    { value: 'onnx', label: 'ONNX', count: 2134 },
    { value: 'tensorrt', label: 'TensorRT', count: 567 },
  ];

  const sizeOptions = [
    { value: 'small', label: 'Small (< 3B parameters)', range: '< 3B' },
    { value: 'medium', label: 'Medium (3B - 13B)', range: '3B - 13B' },
    { value: 'large', label: 'Large (13B - 70B)', range: '13B - 70B' },
    { value: 'xlarge', label: 'Extra Large (> 70B)', range: '> 70B' },
  ];

  const licenseOptions = [
    { value: 'apache-2.0', label: 'Apache 2.0' },
    { value: 'mit', label: 'MIT' },
    { value: 'cc-by-4.0', label: 'CC BY 4.0' },
    { value: 'cc-by-nc-4.0', label: 'CC BY-NC 4.0' },
    { value: 'other', label: 'Other' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Chinese' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Filter Panel */}
      <motion.div
        className="relative ml-auto w-80 h-full bg-[#1a1a1a] border-l border-[#3a3a3a] overflow-y-auto"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#3a3a3a] p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Task/Pipeline Filter */}
          <FilterSection
            title="Task"
            isExpanded={expandedSections.task}
            onToggle={() => toggleSection('task')}
            count={taskOptions.filter(opt => isFilterActive('task', opt.value)).length}
          >
            <div className="space-y-2">
              {taskOptions.map(option => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  count={option.count}
                  checked={isFilterActive('task', option.value)}
                  onChange={(checked) => handleFilterChange('task', option.value, checked)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Library Filter */}
          <FilterSection
            title="Library"
            isExpanded={expandedSections.library}
            onToggle={() => toggleSection('library')}
            count={libraryOptions.filter(opt => isFilterActive('library', opt.value)).length}
          >
            <div className="space-y-2">
              {libraryOptions.map(option => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  count={option.count}
                  checked={isFilterActive('library', option.value)}
                  onChange={(checked) => handleFilterChange('library', option.value, checked)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Model Size Filter */}
          <FilterSection
            title="Model Size"
            isExpanded={expandedSections.size}
            onToggle={() => toggleSection('size')}
            count={sizeOptions.filter(opt => isFilterActive('size', opt.value)).length}
          >
            <div className="space-y-2">
              {sizeOptions.map(option => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  sublabel={option.range}
                  checked={isFilterActive('size', option.value)}
                  onChange={(checked) => handleFilterChange('size', option.value, checked)}
                />
              ))}
            </div>
          </FilterSection>

          {/* License Filter */}
          <FilterSection
            title="License"
            isExpanded={expandedSections.license}
            onToggle={() => toggleSection('license')}
            count={licenseOptions.filter(opt => isFilterActive('license', opt.value)).length}
          >
            <div className="space-y-2">
              {licenseOptions.map(option => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  checked={isFilterActive('license', option.value)}
                  onChange={(checked) => handleFilterChange('license', option.value, checked)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Language Filter */}
          <FilterSection
            title="Language"
            isExpanded={expandedSections.language}
            onToggle={() => toggleSection('language')}
            count={languageOptions.filter(opt => isFilterActive('language', opt.value)).length}
          >
            <div className="space-y-2">
              {languageOptions.map(option => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  checked={isFilterActive('language', option.value)}
                  onChange={(checked) => handleFilterChange('language', option.value, checked)}
                />
              ))}
            </div>
          </FilterSection>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#3a3a3a] p-4 flex space-x-3">
          <button
            onClick={onClear}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper Components
function FilterSection({ title, isExpanded, onToggle, count, children }) {
  return (
    <div className="border-b border-[#2a2a2a] pb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-white font-medium text-sm mb-3 hover:text-blue-400 transition-colors"
      >
        <span className="flex items-center">
          {title}
          {count > 0 && (
            <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
              {count}
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </button>
      {isExpanded && children}
    </div>
  );
}

function FilterCheckbox({ label, sublabel, count, checked, onChange }) {
  return (
    <label className="flex items-center cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
      <div className="ml-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
            {label}
          </span>
          {count && (
            <span className="text-xs text-gray-500 ml-2">
              {count.toLocaleString()}
            </span>
          )}
        </div>
        {sublabel && (
          <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
        )}
      </div>
    </label>
  );
}

FilterSection.propTypes = {
  title: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  count: PropTypes.number,
  children: PropTypes.node.isRequired,
};

FilterCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  sublabel: PropTypes.string,
  count: PropTypes.number,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

FiltersPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default FiltersPanel;
