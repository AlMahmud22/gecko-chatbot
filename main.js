const { app, BrowserWindow, ipcMain, nativeTheme, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const Store = require('electron-store');
const os = require('os');

const {
  getAvailableModels,
  fetchModelDetails,
  downloadModel,
  deleteModel,
  installLocalModel,
  getLocalModels,
  getModelDir,
} = require('./src/backend/models.js');

// Import the improved Hugging Face API module
const {
  fetchModels: fetchHuggingFaceModels,
  fetchModelDetails: fetchHuggingFaceModelDetails,
  fetchModelFiles: fetchHuggingFaceModelFiles
} = require('./src/backend/hf-api-improved.js');

const {
  setupDeepLinking,
  handleDeepLink,
  getAuthToken,
  getHuggingFaceToken,
  saveAuthToken,
  saveHuggingFaceToken,
  clearAuthToken
} = require('./src/backend/auth.js');

const { authService } = require('./src/backend/auth-service.js');

const { runInference } = require('./src/backend/inference.js');
const { getInferenceConfig } = require('./src/backend/config.js');

const store = new Store();

// Set up auth-related IPC handlers
ipcMain.handle('auth:get-token', async () => {
  return getAuthToken();
});

ipcMain.handle('auth:save-token', async (event, token) => {
  return saveAuthToken(token);
});

ipcMain.handle('auth:clear-token', async () => {
  return clearAuthToken();
});

ipcMain.handle('auth:get-hf-token', async () => {
  return getHuggingFaceToken();
});

ipcMain.handle('auth:save-hf-token', async (event, token) => {
  return saveHuggingFaceToken(token);
});

ipcMain.handle('auth:login', async (event, provider = 'google', customRedirect = null) => {
  // 🔧 ENHANCED: Support provider selection and custom redirect URI
  const result = await authService.initiateLogin(provider, customRedirect);
  return result;
});

// Enhanced auth IPC handlers
ipcMain.handle('auth:get-status', async () => {
  return authService.getAuthStatus();
});

ipcMain.handle('auth:get-profile', async () => {
  return authService.getUserProfile();
});

ipcMain.handle('auth:refresh', async () => {
  return await authService.refreshAuth();
});

ipcMain.handle('auth:logout', async () => {
  return authService.logout();
});

// Handle protocol auth callback
ipcMain.handle('auth:process-callback', async (event, token) => {
  return await authService.processAuthCallback(token);
});

// Test protocol handler registration
ipcMain.handle('test-protocol-handler', () => {
  const protocols = ['equatorschatbot', 'myapp'];
  const results = {};
  
  protocols.forEach(protocol => {
    results[protocol] = app.isDefaultProtocolClient(protocol);
  });
  
  return {
    success: true,
    protocols: results,
    registeredHandlers: true
  };
});

// IPC handler to open the models folder
ipcMain.handle('open-models-folder', async () => {
  try {
    const modelDir = getModelDir(); // Get the models directory path
    await shell.openPath(modelDir);
    return { success: true };
  } catch (err) {
    console.error('Failed to open models folder:', err);
    return { success: false, error: err.message };
  }
});

const si = require('systeminformation');

// Import improved system module with proper error handling and no mock data in production
const { getSystemInfo } = require('./src/backend/system-improved.js');

ipcMain.handle('get-system-info', async () => {
  try {
    // Only pass isDev flag in development mode, ensure no mocked data in production
    const systemInfo = await getSystemInfo(isDev);
    
    // In production, never return mocked data - double check
    if (!isDev && systemInfo.isMock) {
      console.warn('Warning: System is returning mock data in production. This should not happen.');
      // Force proper error instead of mocked data in production
      return { 
        error: 'Cannot extract system info: Mock data detected in production',
        platform: process.platform,
        arch: process.arch
      };
    }
    
    return systemInfo;
  } catch (err) {
    console.error('System info fetch failed:', err);
    // Return detailed error information
    return { 
      error: `Failed to fetch system info: ${err.message || 'Unknown error'}`,
      platform: process.platform,
      arch: process.arch,
      cpu: { name: 'Cannot extract system info', cores: 'N/A', threads: 'N/A' },
      memory: { 
        formatted: { total: 'Cannot extract system info', free: 'Cannot extract system info' } 
      },
      gpu: { 
        name: 'Cannot extract system info',
        hasCuda: false,
        formatted: { vram: 'N/A' }
      },
      paths: {
        downloads: 'Cannot extract path info',
        userData: 'Cannot extract path info'
      }
    };
  }
});



async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  // Setup deep linking for authentication
  setupDeepLinking(win);

  if (isDev) {
    await win.loadURL(process.env.DEV_URL || 'http://localhost:5173');
  } else {
    await win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  nativeTheme.on('updated', () => {
    win.webContents.send('theme-updated', {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    });
  });
  
  // Handle the protocol url passed as a command-line argument
  if (process.platform === 'win32' && process.argv.length > 1) {
    // For Windows, we need to manually handle the URL from the command-line args
    const url = process.argv[process.argv.length - 1];
    if (url.startsWith('equatorschatbot://')) {
      handleDeepLink(url, win);
    }
  }

  return win;
}

app.whenReady().then(async () => {
  const mainWindow = await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle protocol URLs on Windows (when app is not running)
if (process.platform === 'win32') {
  // Handle the case when the app is launched via protocol URL
  const args = process.argv.slice(1);
  const protocolUrl = args.find(arg => arg.startsWith('equatorschatbot://'));
  
  if (protocolUrl) {
    app.whenReady().then(() => {
      // Delay to ensure window is ready
      setTimeout(() => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          handleDeepLink(protocolUrl, mainWindow);
        }
      }, 1000);
    });
  }
}

//
// IPC Handlers – Model Management
//
ipcMain.handle('get-available-models', async (_, options) => {
  return await getAvailableModels(options);
});

ipcMain.handle('fetch-model-details', async (_, modelId) => {
  return await fetchModelDetails(modelId);
});

ipcMain.handle('download-model', async (_, modelId, fileName) => {
  return await downloadModel(modelId, fileName);
});

ipcMain.handle('delete-model', async (_, modelId) => {
  return await deleteModel(modelId);
});

ipcMain.handle('install-local-model', async () => {
  return await installLocalModel();
});

ipcMain.handle('get-local-models', async () => {
  return await getLocalModels();
});

//
// IPC Handlers – Inference
//
ipcMain.handle('run-inference', async (_, { modelId, message }) => {
  try {
    const config = await getInferenceConfig();
    return await runInference(modelId, message, config);
  } catch (err) {
    return { error: err.message };
  }
});

//
// IPC Handlers – Hugging Face Token and API
//
ipcMain.handle('save-hf-token', async (_, token) => {
  try {
    store.set('HF_TOKEN', token);
    process.env.HF_TOKEN = token;
    
    // Also update the token in settings
    const settings = store.get('settings') || {};
    settings.huggingFaceToken = token;
    store.set('settings', settings);
    
    return { success: true };
  } catch (err) {
    console.error('Failed to save HF token:', err);
    return { error: err.message };
  }
});

ipcMain.handle('fetch-huggingface-models', async (_, options) => {
  try {
    return await fetchHuggingFaceModels(options);
  } catch (err) {
    console.error('Error fetching Hugging Face models:', err);
    return { error: err.message };
  }
});

ipcMain.handle('fetch-huggingface-model-details', async (_, modelId) => {
  try {
    return await fetchHuggingFaceModelDetails(modelId);
  } catch (err) {
    console.error('Error fetching Hugging Face model details:', err);
    return { error: err.message };
  }
});

ipcMain.handle('fetch-huggingface-model-files', async (_, modelId, revision) => {
  try {
    return await fetchHuggingFaceModelFiles(modelId, revision);
  } catch (err) {
    console.error('Error fetching Hugging Face model files:', err);
    return { error: err.message };
  }
});

//
// IPC Handlers – App Settings
//
ipcMain.handle('get-settings', () => {
  return store.get('settings') || {};
});

ipcMain.handle('save-settings', async (_, settings) => {
  store.set('settings', settings);
  return { success: true };
});

//
// IPC Handlers – Chat Settings
//
ipcMain.handle('get-chat-settings', () => {
  return store.get('chatSettings') || {
    historyEnabled: true,
    maxHistoryLength: 100,
    temperature: 0.7,
    maxTokens: 1000,
  };
});

ipcMain.handle('save-chat-settings', async (_, settings) => {
  store.set('chatSettings', settings);
  return { success: true };
});

//
// IPC Handlers – Performance Settings
//
ipcMain.handle('get-performance-settings', () => {
  return store.get('performanceSettings') || {
    threads: Math.max(1, os.cpus().length - 1),
    batchSize: 512,
    contextSize: 2048,
  };
});

ipcMain.handle('save-performance-settings', async (_, settings) => {
  store.set('performanceSettings', settings);
  return { success: true };
});

//
// IPC Handlers – System Paths
//
ipcMain.handle('get-paths', () => {
  return {
    appData: app.getPath('appData'),
    userData: app.getPath('userData'),
    temp: app.getPath('temp'),
    downloads: app.getPath('downloads'),
    documents: app.getPath('documents'),
  };
});

//
// IPC – Authentication
//
ipcMain.handle('get-auth-token', async () => {
  return getAuthToken();
});

ipcMain.handle('save-auth-token', async (_, token) => {
  saveAuthToken(token);
  return { success: true };
});

ipcMain.handle('clear-auth-token', async () => {
  clearAuthToken();
  return { success: true };
});

//
// IPC – External URLs
//
ipcMain.handle('open-external-url', async (_, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    console.error('Failed to open external URL:', err);
    return { error: err.message };
  }
});

//
// IPC – Navigation (Single declaration)
//
ipcMain.on('navigate-to-chat', (event, modelId) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('navigate', `/chat?model=${modelId}`);
  }
});
