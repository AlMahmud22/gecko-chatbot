import path from 'path';
import os from 'os';
import { app } from 'electron';

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

// Legacy function for backward compatibility
export async function getInferenceConfig() {
  const config = getAppConfig();
  return {
    pythonPath: config.pythonPath,
    modelDir: config.paths.modelDir,
    temperature: config.inference.temperature,
    top_p: config.inference.top_p,
    max_tokens: config.inference.max_tokens,
  };
}
