import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const FilterSection = ({ title, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-4">
      <div 
        className="flex justify-between items-center cursor-pointer mb-2 text-gray-300 hover:text-white"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-medium text-sm">{title}</h3>
        {expanded ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </div>
      {expanded && <div className="space-y-2">{children}</div>}
    </div>
  );
};

FilterSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  defaultExpanded: PropTypes.bool
};

const FilterCheckbox = ({ label, value, checked, onChange, count }) => {
  return (
    <label className="flex items-center justify-between text-sm text-gray-400 hover:text-white cursor-pointer">
      <div className="flex items-center">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={() => onChange(value)} 
          className="mr-2 bg-[#2a2a2a] border-[#3a3a3a] rounded text-green-700 focus:ring-green-600"
        />
        <span>{label}</span>
      </div>
      {count !== undefined && <span className="text-xs bg-[#3a3a3a] px-1.5 py-0.5 rounded">{count}</span>}
    </label>
  );
};

FilterCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  count: PropTypes.number
};

function ModelsSidebar({ 
  filters,
  selectedFilters,
  onFilterChange,
  filterCounts,
  onClearFilters
}) {
  const taskOptions = [
    { label: 'Text Generation', value: 'text-generation' },
    { label: 'Text-to-Image', value: 'text-to-image' },
    { label: 'Image Classification', value: 'image-classification' },
    { label: 'Question Answering', value: 'question-answering' },
    { label: 'Summarization', value: 'summarization' },
    { label: 'Translation', value: 'translation' },
    { label: 'Sentiment Analysis', value: 'text-classification' }
  ];

  const parameterOptions = [
    { label: '<1B', value: '<1B' },
    { label: '1-6B', value: '1-6B' },
    { label: '7-13B', value: '7-13B' },
    { label: '14-20B', value: '14-20B' },
    { label: '>20B', value: '>20B' }
  ];

  const libraryOptions = [
    { label: 'GGUF', value: 'gguf' },
    { label: 'Transformers', value: 'transformers' },
    { label: 'TensorFlow', value: 'tensorflow' },
    { label: 'PyTorch', value: 'pytorch' },
    { label: 'ONNX', value: 'onnx' }
  ];

  const inferenceOptions = [
    { label: 'llama.cpp', value: 'llama.cpp' },
    { label: 'vLLM', value: 'vllm' },
    { label: 'Transformers', value: 'transformers-inference' },
    { label: 'CUDA', value: 'cuda' },
    { label: 'CPU', value: 'cpu' }
  ];

  const handleFilterChange = (category, value) => {
    onFilterChange(category, value);
  };

  return (
    <div className="w-64 flex-shrink-0 bg-[#1a1a1a] p-4 h-full overflow-y-auto border-r border-[#2a2a2a]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-base font-medium">Filters</h2>
        {Object.values(selectedFilters).some(filters => filters.length > 0) && (
          <button 
            className="flex items-center text-sm text-green-500 hover:text-green-400"
            onClick={onClearFilters}
          >
            <XMarkIcon className="w-3.5 h-3.5 mr-1" />
            Clear
          </button>
        )}
      </div>
      
      <FilterSection title="Task">
        {taskOptions.map((option) => (
          <FilterCheckbox
            key={option.value}
            label={option.label}
            value={option.value}
            checked={selectedFilters.task?.includes(option.value) || false}
            onChange={(value) => handleFilterChange('task', value)}
            count={filterCounts?.task?.[option.value]}
          />
        ))}
      </FilterSection>

      <FilterSection title="Model Size">
        {parameterOptions.map((option) => (
          <FilterCheckbox
            key={option.value}
            label={option.label}
            value={option.value}
            checked={selectedFilters.parameters?.includes(option.value) || false}
            onChange={(value) => handleFilterChange('parameters', value)}
            count={filterCounts?.parameters?.[option.value]}
          />
        ))}
      </FilterSection>

      <FilterSection title="Libraries">
        {libraryOptions.map((option) => (
          <FilterCheckbox
            key={option.value}
            label={option.label}
            value={option.value}
            checked={selectedFilters.library?.includes(option.value) || false}
            onChange={(value) => handleFilterChange('library', value)}
            count={filterCounts?.library?.[option.value]}
          />
        ))}
      </FilterSection>

      <FilterSection title="Inference Providers">
        {inferenceOptions.map((option) => (
          <FilterCheckbox
            key={option.value}
            label={option.label}
            value={option.value}
            checked={selectedFilters.inference?.includes(option.value) || false}
            onChange={(value) => handleFilterChange('inference', value)}
            count={filterCounts?.inference?.[option.value]}
          />
        ))}
      </FilterSection>
    </div>
  );
}

ModelsSidebar.propTypes = {
  filters: PropTypes.object,
  selectedFilters: PropTypes.shape({
    task: PropTypes.arrayOf(PropTypes.string),
    parameters: PropTypes.arrayOf(PropTypes.string),
    library: PropTypes.arrayOf(PropTypes.string),
    inference: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  filterCounts: PropTypes.object,
  onClearFilters: PropTypes.func.isRequired
};

export default ModelsSidebar;
