// Enhanced Hugging Face API with proper authentication and error handling
const BASE_URL = 'https://huggingface.co/api';

let authToken = null;

// Set the authentication token
export function setAuthToken(token) {
  authToken = token;
}

// Get authentication headers
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
}

// Fetch models from HuggingFace API
export async function fetchModels(options = {}) {
  const {
    search = '',
    sort = 'downloads',
    direction = 'desc',
    limit = 20,
    filter = '',
    author = '',
    task = '',
    library = '',
    language = '',
    license = '',
    pageUrl = null
  } = options;

  try {
    let url;
    
    if (pageUrl) {
      // Use provided pagination URL
      url = pageUrl;
    } else {
      // Build search URL
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);
      if (direction) params.append('direction', direction);
      if (limit) params.append('limit', limit.toString());
      if (filter) params.append('filter', filter);
      if (author) params.append('author', author);
      if (task) params.append('pipeline_tag', task);
      if (library) params.append('library', library);
      if (language) params.append('language', language);
      if (license) params.append('license', license);
      
      url = `${BASE_URL}/models?${params.toString()}`;
    }

    console.log('Fetching models from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle both paginated and non-paginated responses
    if (Array.isArray(data)) {
      return {
        models: data,
        nextUrl: null
      };
    } else {
      return {
        models: data.models || data.results || [],
        nextUrl: data.next || null
      };
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
}

// Fetch detailed model information
export async function fetchModelDetails(modelId) {
  if (!modelId) {
    throw new Error('Model ID is required');
  }

  try {
    const url = `${BASE_URL}/models/${modelId}`;
    console.log('Fetching model details from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Model not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const modelData = await response.json();
    return modelData;
  } catch (error) {
    console.error('Error fetching model details:', error);
    throw new Error(`Failed to fetch model details: ${error.message}`);
  }
}

// Fetch model files
export async function fetchModelFiles(modelId, revision = 'main') {
  if (!modelId) {
    throw new Error('Model ID is required');
  }

  try {
    const url = `${BASE_URL}/models/${modelId}/tree/${revision}`;
    console.log('Fetching model files from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // Return empty array if no files found
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const files = await response.json();
    return Array.isArray(files) ? files : [];
  } catch (error) {
    console.error('Error fetching model files:', error);
    return []; // Return empty array on error
  }
}

// Get trending models
export async function fetchTrendingModels(limit = 20) {
  return fetchModels({
    sort: 'trending',
    limit,
    filter: 'text-generation'
  });
}

// Get most downloaded models
export async function fetchMostDownloadedModels(limit = 20) {
  return fetchModels({
    sort: 'downloads',
    direction: 'desc',
    limit,
    filter: 'text-generation'
  });
}

// Get newest models
export async function fetchNewestModels(limit = 20) {
  return fetchModels({
    sort: 'created',
    direction: 'desc',
    limit,
    filter: 'text-generation'
  });
}

// Process and normalize model data
export function processModels(models) {
  if (!Array.isArray(models)) {
    console.warn('Expected array of models, got:', typeof models);
    return [];
  }

  return models.map(model => {
    // Normalize model data structure
    const processedModel = {
      id: model.id || model._id || model.modelId || 'unknown-model',
      author: model.author || extractAuthorFromId(model.id),
      description: model.description || model.pipeline_tag || '',
      likes: model.likes || 0,
      downloads: model.downloads || 0,
      tags: Array.isArray(model.tags) ? model.tags : [],
      lastModified: model.lastModified || model.updatedAt || new Date().toISOString(),
      pipeline_tag: model.pipeline_tag || 'text-generation',
      library_name: model.library_name || 'transformers',
      config: model.config || {},
      safetensors: model.safetensors || null,
      siblings: model.siblings || [],
      private: model.private || false,
      disabled: model.disabled || false,
      gated: model.gated || false,
      
      // Additional computed fields
      isInstalled: false, // Will be updated by the UI
      isFavorite: false,  // Will be updated by the UI
      isDownloading: false // Will be updated by the UI
    };

    return processedModel;
  });
}

// Extract author from model ID (e.g., "microsoft/DialoGPT-medium" -> "microsoft")
function extractAuthorFromId(modelId) {
  if (!modelId || typeof modelId !== 'string') return null;
  const parts = modelId.split('/');
  return parts.length > 1 ? parts[0] : null;
}

// Search models by query
export async function searchModels(query, options = {}) {
  return fetchModels({
    search: query,
    ...options
  });
}

// Filter models by task
export async function fetchModelsByTask(task, options = {}) {
  return fetchModels({
    task,
    ...options
  });
}

// Filter models by library
export async function fetchModelsByLibrary(library, options = {}) {
  return fetchModels({
    library,
    ...options
  });
}

export default {
  setAuthToken,
  fetchModels,
  fetchModelDetails,
  fetchModelFiles,
  fetchTrendingModels,
  fetchMostDownloadedModels,
  fetchNewestModels,
  processModels,
  searchModels,
  fetchModelsByTask,
  fetchModelsByLibrary
};
