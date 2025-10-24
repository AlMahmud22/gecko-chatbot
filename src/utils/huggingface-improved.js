/**
 * Client-side HuggingFace API utilities for React components
 */
import axios from 'axios';

// Constants
const HF_API_BASE = 'https://huggingface.co/api';
const DEFAULT_TIMEOUT = 15000;

/**
 * Fetches models from Hugging Face with advanced filtering options
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of results per page (default: 20)
 * @param {string} options.sort - Sort criteria ('downloads', 'trending', 'lastModified')
 * @param {string} options.search - Search query
 * @param {Array} options.task - Tasks to filter by (e.g., ['text-generation'])
 * @param {Array} options.library - Libraries to filter by (e.g., ['pytorch'])
 * @param {string} options.author - Author to filter by
 * @param {string} options.pageUrl - Full URL for pagination
 * @param {Object} options.filters - Additional filters (size, license, etc.)
 * @returns {Promise<{models: Array, nextUrl: string}>} - Models and next page URL
 */
export async function fetchModels(options = {}) {
  try {
    // Access the electronAPI context if available
    const electronAPI = window.electronAPI;
    
    // If electronAPI is available, use that to avoid CORS issues
    if (electronAPI?.fetchHuggingFaceModels) {
      return await electronAPI.fetchHuggingFaceModels(options);
    }
    
    // Otherwise, fallback to direct browser fetch with proper headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Never set User-Agent in browser - this causes issues
    // The browser will set it automatically
    
    // If we have a full pageUrl, use that directly
    if (typeof options.pageUrl === 'string' && options.pageUrl.startsWith('http')) {
      console.log('Fetching models from URL:', options.pageUrl);
      
      const response = await axios.get(options.pageUrl, { 
        headers, 
        timeout: DEFAULT_TIMEOUT 
      });
      
      return processResponse(response);
    } 
    // Otherwise build the URL from options
    else {
      // Extract options
      const { 
        search, 
        limit = 20, 
        task = [], 
        library = [], 
        author,
        filters = {}
      } = options;
      
      // Use valid sort parameter - match HF API exactly
      let sortValue = options.sort || 'downloads';
      if (sortValue === 'trending') {
        sortValue = 'trending';
      } else if (sortValue === 'updated' || sortValue === 'lastModified') {
        sortValue = 'lastModified';
      } else {
        sortValue = 'downloads'; // Default fallback
      }
      
      // Build clean query parameters
      const params = new URLSearchParams();
      
      // Sort parameter
      params.append('sort', sortValue);
      
      // Add limit
      params.append('limit', Math.min(limit, 100).toString()); // Cap at 100
      
      // Add search query if provided
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      // Add pipeline task filters - default to text-generation for best results
      if (task && task.length > 0) {
        task.forEach(t => {
          if (t && t.trim()) params.append('pipeline_tag', t.trim());
        });
      } else {
        // Default to text-generation models if no task specified
        params.append('pipeline_tag', 'text-generation');
      }
      
      // Add library filters
      if (library && library.length > 0) {
        library.forEach(lib => {
          if (lib && lib.trim()) params.append('library', lib.trim());
        });
      }
      
      // Add author filter
      if (author && author.trim()) {
        params.append('author', author.trim());
      }
      
      // Apply additional filters
      if (filters.language) {
        params.append('language', filters.language);
      }
      if (filters.license) {
        params.append('license', filters.license);
      }
      
      const url = `${HF_API_BASE}/models?${params.toString()}`;
      console.log('Fetching models from constructed URL:', url);
      
      const response = await axios.get(url, {
        headers,
        timeout: DEFAULT_TIMEOUT
      });
      
      return processResponse(response);
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Error in fetchModels:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Process model data for display in UI
 * @param {Array} models - Raw model data from API
 * @returns {Array} - Processed model data
 */
export function processModels(models) {
  if (!Array.isArray(models)) return [];
  
  return models.map(model => {
    // Ensure we have fallback values for missing fields
    const modelId = model.id || model.modelId || 'unknown-model';
    const name = model.name || modelId?.split('/').pop() || 'Unnamed Model';
    
    return {
      id: modelId,
      name: name,
      fullName: modelId,
      author: modelId?.split('/')[0] || 'unknown',
      description: model.description || 'No description available',
      lastModified: model.lastModified || model.updatedAt || null,
      tags: Array.isArray(model.tags) ? model.tags : [],
      pipeline_tag: model.pipeline_tag || 'text-generation',
      downloads: typeof model.downloads === 'number' ? model.downloads : 0,
      likes: typeof model.likes === 'number' ? model.likes : 0,
      library_name: model.library_name || (Array.isArray(model.tags) ? model.tags.find(tag => ['pytorch', 'tensorflow', 'transformers', 'gguf'].includes(tag)) : null),
      license: model.cardData?.license || model.license || 'Unknown',
      avatar_url: model.author?.avatar || null,
      isGGUF: (Array.isArray(model.tags) ? model.tags.includes('gguf') : false) || 
              (Array.isArray(model.siblings) ? model.siblings.some(s => s.rfilename?.endsWith('.gguf')) : false),
      isQuantized: 
        (Array.isArray(model.tags) ? model.tags.includes('quantized') : false) || 
        (modelId?.toLowerCase().includes('q')) ||
        false,
      // Extract model size info from tags or id
      parameters: extractParameterCount(modelId, model.tags),
      // Extract quantization info
      quant: extractQuantizationType(modelId, model.tags),
      // File size from siblings
      size: calculateModelSize(model.siblings),
    };
  });
}

/**
 * Extract parameter count from model ID or tags
 * @private
 */
function extractParameterCount(modelId, tags = []) {
  if (!modelId) return 'Unknown';
  
  // Look for patterns like 7B, 13B, 70B, etc.
  const paramMatch = modelId.match(/(\d+(?:\.\d+)?[BM])/i);
  if (paramMatch) {
    return paramMatch[1].toUpperCase();
  }
  
  // Check tags for parameter info
  const paramTag = tags.find(tag => /\d+[BM]/i.test(tag));
  if (paramTag) {
    const match = paramTag.match(/(\d+(?:\.\d+)?[BM])/i);
    return match ? match[1].toUpperCase() : 'Unknown';
  }
  
  return 'Unknown';
}

/**
 * Extract quantization type from model ID or tags
 * @private
 */
function extractQuantizationType(modelId, tags = []) {
  if (!modelId) return 'Unknown';
  
  // Look for quantization patterns like Q4_K_M, Q5_0, etc.
  const quantMatch = modelId.match(/(Q[1-8](?:_K_[SM]|_0|_1)?)/i);
  if (quantMatch) {
    return quantMatch[1].toUpperCase();
  }
  
  // Check tags for quantization info
  const quantTag = tags.find(tag => /Q[1-8]/i.test(tag));
  if (quantTag) {
    return quantTag.toUpperCase();
  }
  
  return 'Unknown';
}

/**
 * Calculate total model size from siblings
 * @private
 */
function calculateModelSize(siblings = []) {
  if (!Array.isArray(siblings)) return 0;
  
  return siblings
    .filter(file => file.rfilename?.endsWith('.gguf'))
    .reduce((total, file) => total + (file.size || 0), 0);
}

/**
 * Filter models for GGUF format (commonly used in local inference)
 * @param {Array} models - Array of model objects
 * @returns {Array} - Filtered array of models
 */
export function filterGGUFModels(models) {
  if (!Array.isArray(models)) return [];
  
  return models.filter(model => {
    // Check model tags for GGUF
    if (model.tags && model.tags.includes('gguf')) {
      return true;
    }
    
    // Check model siblings (files) for GGUF extension
    if (model.siblings && Array.isArray(model.siblings)) {
      return model.siblings.some(file => 
        file.rfilename && file.rfilename.toLowerCase().endsWith('.gguf')
      );
    }
    
    // Check if model name/id includes gguf
    if (model.id && model.id.toLowerCase().includes('gguf')) {
      return true;
    }
    
    return false;
  });
}

/**
 * Processes an Axios response and extracts models and next page URL
 * @private
 */
function processResponse(response) {
  const models = response.data;
  const linkHeader = response.headers.link;
  
  // Parse Link header to get next page URL
  let nextUrl = null;
  if (linkHeader) {
    const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
    if (nextLink) {
      const match = nextLink.match(/<(.+)>/);
      if (match && match[1]) {
        nextUrl = match[1];
      }
    }
  }

  return { models, nextUrl };
}

/**
 * Handle API errors with detailed messages
 * @private
 */
function handleApiError(error) {
  console.error('Error fetching from Hugging Face API:', error);
  
  let errorMessage = 'Failed to fetch models from Hugging Face';
  
  if (error.response) {
    const status = error.response.status;
    
    if (status === 400) {
      errorMessage = 'Bad request: Hugging Face API rejected the request. This could be due to malformed parameters or invalid API usage.';
    } else if (status === 401) {
      errorMessage = 'Authentication failed: Invalid or expired token. Set up your Hugging Face token in settings.';
    } else if (status === 403) {
      errorMessage = 'Access forbidden: You do not have permission to access this resource. Check your Hugging Face account permissions.';
    } else if (status === 429) {
      errorMessage = 'Rate limited: Too many requests to Hugging Face API. Please wait a moment and try again.';
    } else if (status >= 500) {
      errorMessage = 'Hugging Face API server error. Please try again later or report this issue.';
    }
    
    // Add response data if available for debugging
    if (error.response.data) {
      console.error('API Error Response:', error.response.data);
      
      // Add specific error message if available
      if (typeof error.response.data === 'string') {
        errorMessage += ` Details: ${error.response.data}`;
      } else if (error.response.data.error) {
        errorMessage += ` Details: ${error.response.data.error}`;
      }
    }
  } else if (error.request) {
    errorMessage = 'Network error: Could not connect to Hugging Face API. Please check your internet connection.';
  } else if (error.message) {
    errorMessage = `Error: ${error.message}`;
  }
  
  return errorMessage;
}

/**
 * Fetch detailed information about a model
 * @param {string} modelId - Repository ID (username/repo-name)
 * @param {string} token - Optional Hugging Face API token
 * @returns {Promise<Object>} - Model details
 */
export async function fetchModelDetails(modelId, token = '') {
  try {
    // Use electronAPI if available
    const electronAPI = window.electronAPI;
    if (electronAPI?.fetchHuggingFaceModelDetails) {
      return await electronAPI.fetchHuggingFaceModelDetails(modelId);
    }
    
    // Otherwise use direct browser fetch
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(`${HF_API_BASE}/models/${modelId}`, {
      headers,
      timeout: DEFAULT_TIMEOUT
    });
    
    // Get README content in a separate request
    let readme = '';
    try {
      const readmeResponse = await axios.get(`https://huggingface.co/${modelId}/raw/main/README.md`, {
        headers,
        timeout: DEFAULT_TIMEOUT
      });
      readme = readmeResponse.data;
    } catch (readmeError) {
      console.warn(`README not found for ${modelId}`);
    }
    
    return { ...response.data, readme };
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(`Error fetching details for ${modelId}: ${errorMessage}`);
  }
}

/**
 * Fetch files in a model repository
 * @param {string} modelId - Repository ID (username/repo-name) 
 * @param {string} revision - Git revision (branch, tag, commit)
 * @param {string} token - Optional Hugging Face API token
 * @returns {Promise<Array>} - List of files
 */
export async function fetchModelFiles(modelId, revision = 'main', token = '') {
  try {
    // Use electronAPI if available
    const electronAPI = window.electronAPI;
    if (electronAPI?.fetchHuggingFaceModelFiles) {
      return await electronAPI.fetchHuggingFaceModelFiles(modelId, revision);
    }
    
    // Otherwise use direct browser fetch
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(`${HF_API_BASE}/models/${modelId}/tree/${revision}`, {
      headers,
      timeout: DEFAULT_TIMEOUT
    });
    
    // Filter for .gguf files only
    return response.data.filter(file => file.path.endsWith('.gguf'));
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(`Error fetching files for ${modelId}: ${errorMessage}`);
  }
}

export default {
  fetchModels,
  fetchModelDetails,
  fetchModelFiles,
  processModels,
  filterGGUFModels
};
