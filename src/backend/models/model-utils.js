// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\models\model-utils.js

import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// Settings file for storing custom models directory
let customModelsDir = null;

const SETTINGS_FILE_PATH = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'models-config.json');
};

// Read custom models directory from config
function readModelsConfig() {
  try {
    const configPath = SETTINGS_FILE_PATH();
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    }
  } catch (err) {
    console.error('Error reading models config:', err);
  }
  return {};
}

// Write models directory to config
function writeModelsConfig(config) {
  try {
    const configPath = SETTINGS_FILE_PATH();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing models config:', err);
  }
}

// Get the models directory path
export function getModelsDir() {
  // If custom directory is set in memory, use it
  if (customModelsDir) {
    return customModelsDir;
  }
  
  // Try to read from config file
  const config = readModelsConfig();
  if (config.modelsDirectory && fs.existsSync(config.modelsDirectory)) {
    customModelsDir = config.modelsDirectory;
    return customModelsDir;
  }
  
  // Default to userData/models
  const userDataPath = app.getPath('userData');
  const modelsDir = path.join(userDataPath, 'models');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  
  return modelsDir;
}

// Set custom models directory
export function setModelsDir(newPath) {
  if (!fs.existsSync(newPath)) {
    throw new Error('Directory does not exist');
  }
  
  customModelsDir = newPath;
  writeModelsConfig({ modelsDirectory: newPath });
  
  return {
    success: true,
    path: newPath,
  };
}

// Reset to default models directory
export function resetModelsDir() {
  customModelsDir = null;
  const configPath = SETTINGS_FILE_PATH();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  
  const defaultDir = getModelsDir();
  return {
    success: true,
    path: defaultDir,
  };
}

// Get the registry file path
export function getRegistryPath() {
  const modelsDir = getModelsDir();
  return path.join(modelsDir, 'model-registry.json');
}

// Check if a file is a valid GGUF model
export function isGGUFFile(filename) {
  return path.extname(filename).toLowerCase() === '.gguf';
}

// Get file metadata
export function getFileMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    
    return {
      name: fileName,
      path: filePath,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
    };
  } catch (err) {
    console.error('Error getting file metadata:', err);
    return null;
  }
}

// Format file size to human-readable format
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${sizes[i]}`;
}

// Validate model name
export function isValidModelName(name) {
  // Check if name is not empty and contains valid characters
  if (!name || typeof name !== 'string') return false;
  
  // Remove invalid filename characters
  const invalidChars = /[<>:"/\\|?*]/g;
  return !invalidChars.test(name);
}

// Safe JSON parse with fallback
export function safeJSONParse(jsonString, fallback = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('JSON parse error:', err);
    return fallback;
  }
}

// Safe JSON stringify
export function safeJSONStringify(data, indent = 2) {
  try {
    return JSON.stringify(data, null, indent);
  } catch (err) {
    console.error('JSON stringify error:', err);
    return '{}';
  }
}