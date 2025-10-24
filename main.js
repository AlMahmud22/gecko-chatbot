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

const { runInference } = require('./src/backend/inference.js');
const { getInferenceConfig } = require('./src/backend/config.js');

const { getSystemInfo } = require('./src/backend/system-improved.js');

const store = new Store();

//
// IPC Handlers – System Information
//
ipcMain.handle('get-system-info', async () => {
  try {
    const systemInfo = await getSystemInfo(isDev);
    
    if (!isDev && systemInfo.isMock) {
      console.warn('Warning: System is returning mock data in production.');
      return { 
        error: 'Cannot extract system info: Mock data detected in production',
        platform: process.platform,
        arch: process.arch
      };
    }
    
    return systemInfo;
  } catch (err) {
    console.error('System info fetch failed:', err);
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
      }
    };
  }
});

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

ipcMain.handle('open-models-folder', async () => {
  try {
    const modelDir = getModelDir();
    await shell.openPath(modelDir);
    return { success: true };
  } catch (err) {
    console.error('Failed to open models folder:', err);
    return { success: false, error: err.message };
  }
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
// IPC Handlers – Settings (Local Storage)
//
ipcMain.handle('get-settings', () => {
  return store.get('settings') || {};
});

ipcMain.handle('save-settings', async (_, settings) => {
  store.set('settings', settings);
  return { success: true };
});

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
// IPC Handlers – Chat History
//
ipcMain.handle('get-chat-history', () => {
  return store.get('chatHistory') || [];
});

ipcMain.handle('save-chat', async (_, chat) => {
  const history = store.get('chatHistory') || [];
  const newChat = {
    id: Date.now().toString(),
    ...chat,
    createdAt: new Date().toISOString(),
  };
  history.push(newChat);
  store.set('chatHistory', history);
  return { success: true, chat: newChat };
});

ipcMain.handle('delete-chat', async (_, chatId) => {
  const history = store.get('chatHistory') || [];
  const filtered = history.filter(chat => chat.id !== chatId);
  store.set('chatHistory', filtered);
  return { success: true };
});

//
// IPC – Navigation
//
ipcMain.on('navigate-to-chat', (event, modelId) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('navigate', `/chat?model=${modelId}`);
  }
});

//
// Window Management
//
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

  return win;
}

app.whenReady().then(async () => {
  await createWindow();

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