import path from 'path';
import os from 'os';
import { app } from 'electron';
import { getSettingsSection } from './storage/settings-storage.js';

// Detect Python executable based on OS
function getPythonPath() {
  const platform = process.platform;
  
  if (platform === 'win32') {
    return 'python';
  } else if (platform === 'darwin' || platform === 'linux') {
    return 'python3';
  }
  
  // Fallback
  return 'python';
}

// Get application configuration with paths and inference defaults
export function getAppConfig() {
  const homeDir = os.homedir();
  const userDataPath = app.getPath('userData');
  
  return {
    // Application paths
    paths: {
      userData: userDataPath,
      modelDir: path.join(homeDir, '.lama', 'models'),
      cacheDir: path.join(userDataPath, 'cache'),
      logsDir: path.join(userDataPath, 'logs'),
      tempDir: app.getPath('temp'),
    },
    
    // Python configuration
    pythonPath: getPythonPath(),
    
    // Inference defaults
    inference: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 512,
    },
    
    // System information
    system: {
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
    },
  };
}

// Legacy function for backward compatibility - now loads from settings storage
export async function getInferenceConfig() {
  try {
    // Load chat and performance settings from storage
    const chatSettingsResult = await getSettingsSection('chat');
    const performanceSettingsResult = await getSettingsSection('performance');
    
    const chatSettings = chatSettingsResult.success ? chatSettingsResult.settings : {};
    const performanceSettings = performanceSettingsResult.success ? performanceSettingsResult.settings : {};
    
    // Merge settings with safe defaults
    const config = getAppConfig();
    
    return {
      pythonPath: config.pythonPath,
      modelDir: config.paths.modelDir,
      
      // Chat settings
      temperature: chatSettings.temperature ?? 0.7,
      topP: chatSettings.topP ?? 0.9,
      topK: chatSettings.topK ?? 40,
      maxTokens: chatSettings.maxTokens ?? 1000,
      repetitionPenalty: chatSettings.repetitionPenalty ?? 1.1,
      presencePenalty: chatSettings.presencePenalty ?? 0.0,
      frequencyPenalty: chatSettings.frequencyPenalty ?? 0.0,
      mirostat: chatSettings.mirostat ?? 0,
      systemPrompt: chatSettings.systemPrompt ?? '',
      stopSequences: chatSettings.stopSequences ?? [],
      streamingEnabled: chatSettings.streamingEnabled ?? true,
      
      // Performance settings
      threads: performanceSettings.threads ?? Math.max(1, os.cpus().length - 1),
      contextLength: performanceSettings.contextSize ?? 2048,
      batchSize: performanceSettings.batchSize ?? 512,
      gpuLayers: performanceSettings.gpuLayers ?? 0,
    };
  } catch (err) {
    console.error('Failed to load inference config from settings:', err);
    // Fallback to default config
    const config = getAppConfig();
    return {
      pythonPath: config.pythonPath,
      modelDir: config.paths.modelDir,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 1000,
      repetitionPenalty: 1.1,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      mirostat: 0,
      systemPrompt: '',
      stopSequences: [],
      streamingEnabled: true,
      threads: Math.max(1, os.cpus().length - 1),
      contextLength: 2048,
      batchSize: 512,
      gpuLayers: 0,
    };
  }
}
