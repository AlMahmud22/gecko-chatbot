/**
 * Improved Hugging Face API utilities
 */
const axios = require('axios');
const logger = require('./logger');
const Store = require('electron-store');
const store = new Store();

// Constants
const HF_API_BASE = 'https://huggingface.co/api';
const DEFAULT_TIMEOUT = 10000;

/**
 * Fetches models from Hugging Face with advanced filtering options
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of results per page (default: 20)
 * @param {string} options.sort - Sort criteria ('downloads', 'likes', 'lastModified')
 * @param {string} options.search - Search query
 * @param {Array} options.task - Tasks to filter by (e.g., ['text-generation'])
 * @param {Array} options.library - Libraries to filter by (e.g., ['pytorch'])
 * @param {string} options.author - Author to filter by
 * @param {string} options.pageUrl - Full URL for pagination
 * @returns {Promise<{models: Array, nextUrl: string}>} - Models and next page URL
 */
async function fetchModels(options = {}) {
  try {
    // Get token from store (including both auth and HF tokens)
    const authToken = store.get('authToken');
    const hfToken = store.get('huggingFaceToken') || store.get('settings')?.huggingFaceToken || '';
    
    // Prefer HF token from auth payload if available
    let tokenToUse = hfToken;
    if (authToken && !hfToken) {
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        tokenToUse = payload.hf_token || '';
      } catch (err) {
        logger.warn('Failed to extract HF token from auth token:', err);
      }
    }
    
    const headers = tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {};
    
    // If we have a full pageUrl, use that directly for pagination
    if (typeof options.pageUrl === 'string' && options.pageUrl.startsWith('http')) {
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
        pageUrl 
      } = options;
      
      // Use a valid sort parameter (trending is no longer valid)
      let sortValue = options.sort || 'downloads';
      if (!['downloads', 'likes', 'lastModified'].includes(sortValue)) {
        sortValue = 'downloads'; // Fallback to downloads if invalid sort
      }
      
      // Build clean query parameters
      const params = new URLSearchParams();
      
      // Sort parameter MUST come first (API requirement)
      params.append('sort', sortValue);
      
      // Add limit after sort
      params.append('limit', limit.toString());
      
      // Add search query if provided
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      // Add pipeline task filters
      if (task && task.length > 0) {
        task.forEach(t => {
          if (t) params.append('pipeline_tag', t);
        });
      }
      
      // Add library filters
      if (library && library.length > 0) {
        library.forEach(lib => {
          if (lib) params.append('library', lib);
        });
      }
      
      // Add author filter
      if (author && author.trim()) {
        params.append('author', author.trim());
      }
      
      const url = `${HF_API_BASE}/models?${params.toString()}`;
      
      // Make request with appropriate headers
      const response = await axios.get(url, {
        headers,
        timeout: DEFAULT_TIMEOUT
      });
      
      return processResponse(response);
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
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
  logger.error('Error fetching from Hugging Face API:', error);
  
  let errorMessage = 'Failed to fetch models from Hugging Face';
  
  if (error.response) {
    const status = error.response.status;
    
    if (status === 400) {
      errorMessage = 'Bad request: Check your search parameters';
      logger.error('Bad request details:', error.response.data);
    } else if (status === 401) {
      errorMessage = 'Authentication failed: Invalid or expired token';
    } else if (status === 403) {
      errorMessage = 'Access forbidden: You do not have permission to access this resource';
    } else if (status === 429) {
      errorMessage = 'Rate limited: Too many requests to Hugging Face API';
    } else if (status >= 500) {
      errorMessage = 'Hugging Face API server error';
    }
  } else if (error.request) {
    errorMessage = 'Network error: Could not connect to Hugging Face API';
  }
  
  return errorMessage;
}

/**
 * Fetch detailed information about a model
 * @param {string} modelId - Repository ID (username/repo-name)
 * @returns {Promise<Object>} - Model details
 */
async function fetchModelDetails(modelId) {
  try {
    const token = store.get('settings')?.huggingFaceToken || '';
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
      logger.warn(`README not found for ${modelId}`);
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
 * @returns {Promise<Array>} - List of files
 */
async function fetchModelFiles(modelId, revision = 'main') {
  try {
    const token = store.get('settings')?.huggingFaceToken || '';
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

module.exports = {
  fetchModels,
  fetchModelDetails,
  fetchModelFiles
};
