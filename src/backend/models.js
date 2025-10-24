const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { app, dialog } = require('electron');
const Store = require('electron-store');
const { getInstalledModels, saveInstalledModel, deleteInstalledModel } = require('./storage');
require('dotenv').config();

// Enhanced cache implementation
let cache;
try {
  const NodeCache = require('node-cache');
  cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  console.log('NodeCache initialized successfully');
} catch (error) {
  console.error('Failed to initialize NodeCache:', error);
  // Fallback in-memory cache
  const fallbackCache = new Map();
  cache = {
    get: (key) => {
      const item = fallbackCache.get(key);
      if (item && item.expiry > Date.now()) {
        return item.value;
      }
      fallbackCache.delete(key);
      return null;
    },
    set: (key, val, ttl = 3600) => {
      fallbackCache.set(key, {
        value: val,
        expiry: Date.now() + (ttl * 1000)
      });
    },
    del: (key) => fallbackCache.delete(key),
    has: (key) => {
      const item = fallbackCache.get(key);
      return item && item.expiry > Date.now();
    },
    flushAll: () => fallbackCache.clear()
  };
}

const store = new Store();

function getHfToken() {
  return store.get('hf_token') || process.env.HF_TOKEN || '';
}

const modelDir = process.env.MODEL_DIR || (
  process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../models')
    : path.join(app.getPath('appData'), 'equators-chatbot', 'models')
);

/**
 * Get local models with enhanced metadata from MongoDB
 */
async function getLocalModels() {
  try {
    await fs.mkdir(modelDir, { recursive: true });
    const files = await fs.readdir(modelDir);
    
    // Get installed models from MongoDB
    const installedModels = await getInstalledModels();
    const installedModelMap = new Map();
    installedModels.forEach(model => {
      installedModelMap.set(path.basename(model.filePath), model);
    });
    
    const models = await Promise.all(
      files
        .filter((file) => file.endsWith('.gguf') || file.endsWith('.bin'))
        .map(async (file) => {
          const filePath = path.join(modelDir, file);
          const stats = await fs.stat(filePath);
          const id = file.replace(/\.(gguf|bin)$/, '');
          
          // Check if we have metadata stored in MongoDB
          const installedModel = installedModelMap.get(file);
          
          return {
            id,
            name: installedModel?.name || id,
            file_path: filePath,
            size: stats.size,
            description: installedModel?.description || `Local model: ${id}`,
            quant: installedModel?.quant || extractQuantizationType(id),
            parameters: installedModel?.parameters || extractParameterCount(id),
            tags: installedModel?.tags || ['local', 'gguf'],
            license: installedModel?.license || 'Unknown',
            downloads: installedModel?.downloads || 0,
            likes: installedModel?.likes || 0,
            library_name: installedModel?.library_name || 'gguf',
            pipeline_tag: installedModel?.pipeline_tag || 'text-generation',
            avatar_url: installedModel?.avatar_url || null,
            isInstalled: true,
            hfRepoId: installedModel?.originalHuggingFaceId || estimateHfRepoId(id),
            originalHuggingFaceId: installedModel?.originalHuggingFaceId,
            downloadedAt: installedModel?.downloadedAt || stats.mtime.toISOString(),
            lastModified: installedModel?.lastModified || stats.mtime.toISOString(),
          };
        })
    );
    return models;
  } catch (err) {
    console.error('Error reading local models:', err);
    return [];
  }
}

/**
 * Enhanced HuggingFace API integration
 */
async function fetchHuggingFaceModels(options = {}) {
  const { 
    search = '', 
    sort = 'downloads',
    limit = 20, 
    skip = 0,
    task = [],
    library = [],
    filters = {},
    pageUrl
  } = options;
  
  // Use pageUrl directly if provided for pagination
  if (pageUrl) {
    const cacheKey = `hf-page-${pageUrl}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      const token = getHfToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(pageUrl, {
        headers,
        timeout: 15000
      });

      const result = {
        models: response.data || [],
        nextUrl: extractNextUrl(response.headers.link)
      };

      cache.set(cacheKey, result, 1800); // 30 min cache
      return result;
    } catch (error) {
      console.error('Error fetching HF models with pageUrl:', error);
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  // Build query from parameters
  const cacheKey = `hf-models-${search}-${sort}-${skip}-${limit}-${JSON.stringify(task)}-${JSON.stringify(library)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    
    // Sort is required and must be first
    params.append('sort', sort);
    params.append('limit', limit.toString());
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    
    // Always filter for GGUF models for local inference
    if (!search || !search.includes('gguf')) {
      params.append('filter', 'gguf');
    }
    
    // Add task filters
    if (Array.isArray(task) && task.length > 0) {
      task.forEach(t => params.append('pipeline_tag', t));
    } else {
      params.append('pipeline_tag', 'text-generation');
    }
    
    // Add library filters
    if (Array.isArray(library) && library.length > 0) {
      library.forEach(lib => params.append('library', lib));
    }
    
    // Add additional filters
    if (filters.language) {
      params.append('language', filters.language);
    }
    if (filters.license) {
      params.append('license', filters.license);
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    const token = getHfToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `https://huggingface.co/api/models?${params.toString()}`;
    console.log('Fetching HF models from:', url);

    const response = await axios.get(url, {
      headers,
      timeout: 15000
    });

    const result = {
      models: response.data || [],
      nextUrl: extractNextUrl(response.headers.link)
    };

    cache.set(cacheKey, result, 1800); // 30 min cache
    return result;
  } catch (error) {
    console.error('Error fetching HF models:', error);
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
}

/**
 * Enhanced local model installation with metadata persistence
 */
async function installLocalModel() {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Model File',
      properties: ['openFile'],
      filters: [
        { name: 'GGUF Models', extensions: ['gguf'] },
        { name: 'Binary Models', extensions: ['bin'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, message: 'No file selected' };
    }

    const sourceFile = result.filePaths[0];
    const fileName = path.basename(sourceFile);
    const targetFile = path.join(modelDir, fileName);

    // Ensure models directory exists
    await fs.mkdir(modelDir, { recursive: true });

    // Check if file already exists
    try {
      await fs.access(targetFile);
      return { success: false, message: 'Model already exists in the models folder' };
    } catch (err) {
      // File doesn't exist, proceed with copy
    }

    // Copy the file
    await fs.copyFile(sourceFile, targetFile);
    
    // Get file stats
    const stats = await fs.stat(targetFile);
    const modelId = fileName.replace(/\.(gguf|bin)$/, '');
    
    // Create metadata for MongoDB
    const modelMetadata = {
      id: modelId,
      name: modelId,
      filePath: targetFile,
      size: stats.size,
      description: `Locally installed model: ${modelId}`,
      quant: extractQuantizationType(modelId),
      parameters: extractParameterCount(modelId),
      tags: ['local', 'gguf'],
      license: 'Unknown',
      downloads: 0,
      likes: 0,
      library_name: 'gguf',
      pipeline_tag: 'text-generation',
      downloadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isLocal: true
    };

    // Save to MongoDB
    await saveInstalledModel(modelMetadata);

    return { 
      success: true, 
      message: 'Model installed successfully',
      modelName: modelId,
      model: modelMetadata
    };
  } catch (error) {
    console.error('Error installing local model:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to install model'
    };
  }
}

// Helper functions
function extractQuantizationType(modelId) {
  if (!modelId) return 'Unknown';
  const quantMatch = modelId.match(/(Q[1-8](?:_K_[SM]|_0|_1)?)/i);
  return quantMatch ? quantMatch[1].toUpperCase() : 'Unknown';
}

function extractParameterCount(modelId) {
  if (!modelId) return 'Unknown';
  const paramMatch = modelId.match(/(\d+(?:\.\d+)?[BM])/i);
  return paramMatch ? paramMatch[1].toUpperCase() : 'Unknown';
}

function estimateHfRepoId(modelId) {
  // Try to guess the HuggingFace repo ID from the model name
  // This is a best-effort approach
  const commonPatterns = [
    /^(.+?)[-_](\d+(?:\.\d+)?[BM])[-_](Q\d+)/i,
    /^(.+?)[-_](\d+(?:\.\d+)?[BM])/i,
    /^(.+?)[-_](Q\d+)/i
  ];
  
  for (const pattern of commonPatterns) {
    const match = modelId.match(pattern);
    if (match) {
      const baseName = match[1].replace(/[-_]/g, '-');
      return `microsoft/${baseName}` || `huggingface/${baseName}`;
    }
  }
  
  return null;
}

function extractNextUrl(linkHeader) {
  if (!linkHeader) return null;
  
  const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
  if (nextLink) {
    const match = nextLink.match(/<(.+)>/);
    return match ? match[1] : null;
  }
  
  return null;
}

async function fetchModelDetails(modelId) {
  const cacheKey = `hf-model-details-${modelId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const localModels = await getLocalModels();
  const localModel = localModels.find((m) => m.id === modelId);
  if (localModel) {
    return {
      ...localModel,
      readme: 'No README available for local models',
      files: [{ name: `${modelId}.gguf`, size: localModel.size, quant: localModel.quant }],
    };
  }

  try {
    const headers = getHfToken() ? { Authorization: `Bearer ${getHfToken()}` } : {};
    const hfRepoId = estimateHfRepoId(modelId);
    const [modelResponse, readmeResponse] = await Promise.all([
      axios.get(`https://huggingface.co/api/models/${hfRepoId}`, {
        headers,
        timeout: 5000,
      }),
      axios.get(`https://huggingface.co/${hfRepoId}/raw/main/README.md`, {
        headers,
        timeout: 5000,
      }).catch(() => ({ data: 'No README available' })),
    ]);
    const model = modelResponse.data;
    const filesResponse = await axios.get(`https://huggingface.co/api/models/${hfRepoId}/tree/main`, {
      headers,
      timeout: 5000,
    });
    const files = filesResponse.data.filter((file) => file.path.endsWith('.gguf'));
    const details = {
      id: model.id,
      name: model.id.split('/').pop(),
      description: model.cardData?.description || 'No description available',
      readme: readmeResponse.data,
      tags: model.tags || [],
      quant: model.cardData?.quantization || estimateQuant(model.id),
      parameters: model.cardData?.parameters || estimateParameters(model.id),
      size: model.cardData?.size || 0,
      license: model.cardData?.license || 'Unknown',
      downloads: model.downloads || 0,
      files: files.map((file) => ({
        name: file.path.split('/').pop(),
        size: file.size,
        quant: file.path.match(/(Q[1-5](?:_K_[SM])?)/)?.[1] || 'Unknown',
      })),
      isInstalled: localModels.some((m) => m.hfRepoId === hfRepoId),
      hfRepoId: model.id,
    };
    cache.set(cacheKey, details);
    return details;
  } catch (err) {
    console.error(`Error fetching details for model ${modelId}:`, err);
    return null;
  }
}

async function downloadModel(modelId, fileName) {
  try {
    const hfRepoId = estimateHfRepoId(modelId);
    const fileUrl = `https://huggingface.co/${hfRepoId}/resolve/main/${fileName}`;
    const filePath = path.join(modelDir, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const fileHandle = await fs.open(filePath, 'w');
    const writer = fileHandle.createWriteStream();
    
    // Get model details if possible
    let modelDetails = null;
    try {
      // First try to get model details
      const modelResponse = await axios.get(`https://huggingface.co/api/models/${hfRepoId}`, {
        headers: getHfToken() ? { Authorization: `Bearer ${getHfToken()}` } : {},
        timeout: 5000,
      });
      modelDetails = modelResponse.data;
    } catch (detailsError) {
      console.error(`Could not fetch model details for ${hfRepoId}:`, detailsError.message);
    }
    
    // Download the model file
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
      headers: getHfToken() ? { Authorization: `Bearer ${getHfToken()}` } : {},
      timeout: 30000,
    });
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        await fileHandle.close();
        
        // Get file stats
        const stats = await fs.stat(filePath);
        
        // Save model metadata to MongoDB
        const modelData = {
          _id: fileName, // Use filename as ID
          name: fileName.replace('.gguf', ''),
          filePath: `models/${fileName}`,
          downloadedAt: new Date(),
          size: stats.size,
          quant: estimateQuant(fileName),
          parameters: estimateParameters(fileName),
          originalHuggingFaceId: hfRepoId,
          description: modelDetails?.cardData?.description || `Downloaded model from ${hfRepoId}`,
          tags: modelDetails?.tags || ['downloaded'],
          license: modelDetails?.cardData?.license || 'Unknown',
          downloads: modelDetails?.downloads || 0
        };
        
        await saveInstalledModel(modelData);
        resolve();
      });
      writer.on('error', async (err) => {
        await fileHandle.close();
        reject(err);
      });
    });
  } catch (err) {
    console.error(`Error downloading model ${modelId}/${fileName}:`, err);
    throw err;
  }
}

async function deleteModel(modelId) {
  try {
    const modelFileName = `${modelId}.gguf`;
    const modelPath = path.join(modelDir, modelFileName);
    if (await fs.access(modelPath).then(() => true).catch(() => false)) {
      await fs.unlink(modelPath);
      // Delete model metadata from MongoDB
      await deleteInstalledModel(modelFileName);
    }
  } catch (err) {
    console.error('Failed to delete model:', err);
    throw err;
  }
}

async function installLocalModel() {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'GGUF Models', extensions: ['gguf'] }
      ],
      title: 'Select a GGUF model file to import'
    });
    
    if (result.canceled || !result.filePaths.length) {
      return { success: false, message: 'File selection canceled' };
    }
    
    const sourcePath = result.filePaths[0];
    const fileName = path.basename(sourcePath);
    const destPath = path.join(modelDir, fileName);
    
    // Create models directory if it doesn't exist
    await fs.mkdir(modelDir, { recursive: true });
    
    // Check if file already exists
    const fileExists = await fs.access(destPath).then(() => true).catch(() => false);
    
    if (fileExists) {
      return { 
        success: false, 
        message: `Model ${fileName} already exists in the models folder` 
      };
    }
    
    // Copy the file
    await fs.copyFile(sourcePath, destPath);
    
    // Get file stats
    const stats = await fs.stat(destPath);
    
    // Attempt to get model name without extension and version numbers
    const cleanedName = fileName.replace(/\.gguf$/, '').replace(/[-_]v\d+(\.\d+)?/i, '');
    
    // Save model metadata to MongoDB
    const modelData = {
      _id: fileName, // Use filename as ID
      name: cleanedName,
      filePath: `models/${fileName}`,
      downloadedAt: new Date(),
      size: stats.size,
      quant: estimateQuant(fileName),
      parameters: estimateParameters(fileName),
      originalHuggingFaceId: null,
      description: `Locally added model: ${cleanedName}`,
      tags: ['local', 'user-added'],
      license: 'Unknown',
    };
    
    await saveInstalledModel(modelData);
    
    return { 
      success: true, 
      message: 'Model imported successfully',
      model: modelData
    };
  } catch (err) {
    console.error('Failed to install local model:', err);
    return { 
      success: false, 
      message: `Error importing model: ${err.message}` 
    };
  }
}

function estimateQuant(modelId) {
  const match = modelId.match(/(Q[1-5](?:_K_[SM])?)/);
  return match ? match[1] : 'Unknown';
}

function estimateParameters(modelId) {
  const match = modelId.match(/(\d+\.\d+B|\d+B)/);
  return match ? match[1] : 'Unknown';
}

function estimateHfRepoId(id) {
  const modelMap = {
    'tinydolphin-2.8-1.1b.Q2_K': 'TheBloke/TinyDolphin-2.8-1.1b-GGUF',
  };
  return modelMap[id] || id;
}

async function getAvailableModels({ searchQuery = '', limit = 50, skip = 0 } = {}) {
  const [localModels, remoteModels] = await Promise.all([
    getLocalModels(),
    fetchHuggingFaceModels({ searchQuery, limit, skip }),
  ]);
  const localModelIds = new Set(localModels.map((m) => m.hfRepoId));
  return [
    ...localModels,
    ...remoteModels.map((model) => ({
      ...model,
      isInstalled: localModelIds.has(model.hfRepoId),
    })),
  ];
}

function getModelDir() {
  return modelDir;
}

module.exports = {
  getAvailableModels,
  fetchModelDetails,
  downloadModel,
  deleteModel,
  installLocalModel,
  getLocalModels,
  getModelDir,
};
