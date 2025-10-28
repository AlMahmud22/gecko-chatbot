// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\models\models-service.js

import fs from 'fs';
// Models Service
import path from 'path';
import { dialog } from 'electron';
import {
  getModelsDir,
  setModelsDir,
  resetModelsDir,
  getRegistryPath,
  isGGUFFile,
  getFileMetadata,
  safeJSONParse,
  safeJSONStringify,
} from './model-utils.js';

// Read model registry from JSON file
function readRegistry() {
  const registryPath = getRegistryPath();
  
  // Return empty registry if file doesn't exist
  if (!fs.existsSync(registryPath)) {
    return { models: {} };
  }
  
  // Read and parse registry file
  const data = fs.readFileSync(registryPath, 'utf8');
  return safeJSONParse(data, { models: {} });
}

// Write model registry to JSON file
function writeRegistry(registry) {
  const registryPath = getRegistryPath();
  const data = safeJSONStringify(registry);
  fs.writeFileSync(registryPath, data, 'utf8');
}

// Get all available models (scanned from directory + registry info + external models)
export async function getAvailableModels() {
  try {
    const modelsDir = getModelsDir();
    
    // Read all files in models directory
    const files = fs.readdirSync(modelsDir);
    
    // Filter only GGUF files
    const modelFiles = files.filter(isGGUFFile);
    
    // Read registry to get active/inactive status
    let registry = readRegistry();
    
    // Ensure registry.models exists
    if (!registry.models) {
      registry.models = {};
    }
    
    // Auto-sync: Add missing files in models directory to registry
    let needsWrite = false;
    modelFiles.forEach(file => {
      if (!registry.models[file]) {
        registry.models[file] = {
          name: file,
          active: false,
          installedAt: new Date().toISOString(),
          isExternal: false,
        };
        needsWrite = true;
      }
    });
    
    // Auto-sync: Remove entries for deleted local files (but keep external models)
    Object.keys(registry.models).forEach(name => {
      const modelInfo = registry.models[name];
      
      if (modelInfo.isExternal) {
        // For external models, check if the external file still exists
        if (!fs.existsSync(modelInfo.sourcePath)) {
          delete registry.models[name];
          needsWrite = true;
        }
      } else {
        // For local models, check if file exists in models directory
        const filePath = path.join(modelsDir, name);
        if (!fs.existsSync(filePath)) {
          delete registry.models[name];
          needsWrite = true;
        }
      }
    });
    
    // Write registry if changes were made
    if (needsWrite) {
      writeRegistry(registry);
    }
    
    // Build models list from registry (includes both local and external)
    const models = Object.keys(registry.models).map(fileName => {
      const registryInfo = registry.models[fileName];
      
      // Determine the actual file path (external or local)
      const filePath = registryInfo.isExternal 
        ? registryInfo.sourcePath 
        : path.join(modelsDir, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const metadata = getFileMetadata(filePath);
      if (!metadata) return null;
      
      return {
        ...metadata,
        id: fileName,
        active: registryInfo.active || false,
        activatedAt: registryInfo.activatedAt || null,
        isExternal: registryInfo.isExternal || false,
        externalPath: registryInfo.isExternal ? registryInfo.sourcePath : null,
      };
    }).filter(Boolean);
    
    return {
      success: true,
      models,
      count: models.length,
    };
  } catch (err) {
    console.error('Error getting available models:', err);
    return {
      success: false,
      error: err.message,
      models: [],
      count: 0,
    };
  }
}

// Scan models directory for GGUF files (alias for backward compatibility)
export async function scanModels() {
  return getAvailableModels();
}

// Get details for a specific model (alias fetchModelDetails)
export async function fetchModelDetails(modelName) {
  return getModelDetails(modelName);
}

// Get details for a specific model
export async function getModelDetails(modelName) {
  try {
    const modelsDir = getModelsDir();
    const modelPath = path.join(modelsDir, modelName);
    
    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      throw new Error('Model not found');
    }
    
    // Get model metadata
    const metadata = getFileMetadata(modelPath);
    
    // Get model status from registry
    const registry = readRegistry();
    const registryInfo = registry.models[modelName] || {};
    
    return {
      success: true,
      model: {
        ...metadata,
        id: modelName,
        active: registryInfo.active || false,
        activatedAt: registryInfo.activatedAt || null,
        deactivatedAt: registryInfo.deactivatedAt || null,
      },
    };
  } catch (err) {
    console.error('Error getting model details:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Delete a model file
export async function deleteModel(modelName) {
  try {
    const registry = readRegistry();
    const modelInfo = registry.models[modelName];
    
    if (!modelInfo) {
      throw new Error('Model not found in registry');
    }
    
    if (modelInfo.isExternal) {
      // External model - only remove from registry, don't delete the file
      console.log(`Removing external model from registry: ${modelName}`);
      delete registry.models[modelName];
      writeRegistry(registry);
      
      return {
        success: true,
        message: 'External model unlinked from app (file not deleted from your computer)',
      };
    } else {
      // Local model - delete the file from models directory
      const modelsDir = getModelsDir();
      const modelPath = path.join(modelsDir, modelName);
      
      // Check if model file exists
      if (fs.existsSync(modelPath)) {
        // Delete the model file
        fs.unlinkSync(modelPath);
      }
      
      // Remove from registry
      delete registry.models[modelName];
      writeRegistry(registry);
      
      return {
        success: true,
        message: 'Model deleted successfully',
      };
    }
  } catch (err) {
    console.error('Error deleting model:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Activate a model in the registry
export async function activateModel(modelName) {
  try {
    const modelsDir = getModelsDir();
    const modelPath = path.join(modelsDir, modelName);
    
    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      throw new Error('Model not found');
    }
    
    // Update registry
    const registry = readRegistry();
    
    // Initialize models object if it doesn't exist
    if (!registry.models) {
      registry.models = {};
    }
    
    // Set model as active
    registry.models[modelName] = {
      name: modelName,
      active: true,
      activatedAt: new Date().toISOString(),
    };
    
    writeRegistry(registry);
    
    return {
      success: true,
      message: 'Model activated successfully',
    };
  } catch (err) {
    console.error('Error activating model:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Deactivate a model in the registry
export async function deactivateModel(modelName) {
  try {
    const registry = readRegistry();
    
    // Check if model exists in registry
    if (!registry.models || !registry.models[modelName]) {
      throw new Error('Model not found in registry');
    }
    
    // Set model as inactive
    registry.models[modelName].active = false;
    registry.models[modelName].deactivatedAt = new Date().toISOString();
    
    writeRegistry(registry);
    
    return {
      success: true,
      message: 'Model deactivated successfully',
    };
  } catch (err) {
    console.error('Error deactivating model:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Get list of active models
export async function getLocalModels() {
  try {
    const registry = readRegistry();
    const modelsDir = getModelsDir();
    
    // Filter active models from registry
    const activeModelNames = Object.keys(registry.models || {}).filter(
      name => registry.models[name].active === true
    );
    
    // Get metadata for each active model
    const models = activeModelNames.map(name => {
      const modelInfo = registry.models[name];
      
      // Determine actual file path (external or local)
      const modelPath = modelInfo.isExternal 
        ? modelInfo.sourcePath 
        : path.join(modelsDir, name);
      
      // Skip if file doesn't exist
      if (!fs.existsSync(modelPath)) {
        console.warn(`Active model file not found: ${name} at ${modelPath}`);
        return null;
      }
      
      const metadata = getFileMetadata(modelPath);
      return {
        ...metadata,
        id: name,
        active: true,
        isExternal: modelInfo.isExternal || false,
        externalPath: modelInfo.isExternal ? modelInfo.sourcePath : null,
      };
    }).filter(Boolean);
    
    return {
      success: true,
      models,
      count: models.length,
    };
  } catch (err) {
    console.error('Error getting local models:', err);
    return {
      success: false,
      error: err.message,
      models: [],
      count: 0,
    };
  }
}

// Install a local model by selecting a .gguf file
export async function installLocalModel() {
  try {
    // Open file dialog to select .gguf file
    const result = await dialog.showOpenDialog({
      title: 'Select GGUF Model File',
      filters: [
        { name: 'GGUF Models', extensions: ['gguf'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    // Check if user cancelled
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return {
        success: false,
        cancelled: true,
        message: 'Model selection cancelled',
      };
    }
    
    const sourcePath = result.filePaths[0];
    const fileName = path.basename(sourcePath);
    
    // Validate it's a GGUF file
    if (!isGGUFFile(fileName)) {
      throw new Error('Selected file is not a valid GGUF model');
    }
    
    // Get models directory
    const modelsDir = getModelsDir();
    const destPath = path.join(modelsDir, fileName);
    
    // Check if model already exists in registry
    const registry = readRegistry();
    if (!registry.models) {
      registry.models = {};
    }
    
    // Check if user selected a file that's already in the models directory
    const sourceDir = path.dirname(sourcePath);
    const isInModelsDir = path.resolve(sourceDir) === path.resolve(modelsDir);
    
    if (isInModelsDir) {
      // File is already in models directory - just register it (no copy needed)
      console.log('File is already in models directory, registering without copy');
      
      if (!registry.models[fileName]) {
        registry.models[fileName] = {
          name: fileName,
          active: true,
          activatedAt: new Date().toISOString(),
          installedAt: new Date().toISOString(),
          sourcePath: sourcePath,
          isExternal: false,
        };
        writeRegistry(registry);
      } else if (!registry.models[fileName].active) {
        // Activate if it was inactive
        registry.models[fileName].active = true;
        registry.models[fileName].activatedAt = new Date().toISOString();
        writeRegistry(registry);
      }
      
      const metadata = getFileMetadata(sourcePath);
      return {
        success: true,
        message: 'Model registered successfully',
        model: {
          ...metadata,
          id: fileName,
          active: true,
        },
      };
    }
    
    // File is outside models directory - link it externally without copying
    console.log('File is outside models directory, linking externally');
    
    // Check if a model with this name already exists
    if (registry.models[fileName]) {
      const response = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Replace', 'Cancel'],
        defaultId: 1,
        title: 'Model Already Exists',
        message: `A model named "${fileName}" already exists.`,
        detail: 'Do you want to replace it with the selected file?',
      });
      
      if (response.response === 1) {
        // User chose Cancel
        return {
          success: false,
          cancelled: true,
          message: 'Installation cancelled by user',
        };
      }
      
      // User chose Replace - remove old entry (but don't delete file)
      const oldModel = registry.models[fileName];
      if (oldModel.isExternal === false && fs.existsSync(path.join(modelsDir, fileName))) {
        // Old model was local (in models dir), delete it
        fs.unlinkSync(path.join(modelsDir, fileName));
      }
    }
    
    // Add external model to registry
    registry.models[fileName] = {
      name: fileName,
      active: true,
      activatedAt: new Date().toISOString(),
      installedAt: new Date().toISOString(),
      sourcePath: sourcePath, // Store the external path
      isExternal: true, // Mark as external
    };
    
    writeRegistry(registry);
    
    // Get metadata for the installed model
    const metadata = getFileMetadata(sourcePath);
    
    return {
      success: true,
      message: 'Model linked successfully (no copy)',
      model: {
        ...metadata,
        id: fileName,
        active: true,
        isExternal: true,
      },
    };
  } catch (err) {
    console.error('Error installing local model:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}
// Sync registry with actual files in models directory
// This will add any missing files to registry and remove entries for deleted files
export async function syncRegistry() {
  try {
    const modelsDir = getModelsDir();
    const registry = readRegistry();
    
    if (!registry.models) {
      registry.models = {};
    }
    
    // Get all GGUF files in the directory
    const files = fs.readdirSync(modelsDir);
    const modelFiles = files.filter(isGGUFFile);
    
    // Add missing files to registry (as inactive)
    modelFiles.forEach(fileName => {
      if (!registry.models[fileName]) {
        registry.models[fileName] = {
          name: fileName,
          active: false,
          installedAt: new Date().toISOString(),
        };
      }
    });
    
    // Remove registry entries for files that no longer exist
    const registryNames = Object.keys(registry.models);
    registryNames.forEach(name => {
      const filePath = path.join(modelsDir, name);
      if (!fs.existsSync(filePath)) {
        delete registry.models[name];
      }
    });
    
    writeRegistry(registry);
    
    return {
      success: true,
      message: 'Registry synced successfully',
      added: modelFiles.filter(f => !registryNames.includes(f)).length,
      removed: registryNames.filter(n => !modelFiles.includes(n)).length,
    };
  } catch (err) {
    console.error('Error syncing registry:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}


// Get current models directory path
export async function getModelsDirectory() {
  try {
    const modelsDir = getModelsDir();
    return {
      success: true,
      path: modelsDir,
    };
  } catch (err) {
    console.error('Error getting models directory:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Change models directory
export async function changeModelsDirectory() {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Models Directory',
      properties: ['openDirectory', 'createDirectory'],
    });
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return {
        success: false,
        cancelled: true,
        message: 'Directory selection cancelled',
      };
    }
    
    const newPath = result.filePaths[0];
    const changeResult = setModelsDir(newPath);
    
    return {
      success: true,
      path: newPath,
      message: 'Models directory changed successfully',
    };
  } catch (err) {
    console.error('Error changing models directory:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Reset models directory to default
export async function resetModelsDirectory() {
  try {
    const result = resetModelsDir();
    return {
      ...result,
      message: 'Models directory reset to default',
    };
  } catch (err) {
    console.error('Error resetting models directory:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}
