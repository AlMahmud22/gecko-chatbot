// Electron Main Process
import { app, BrowserWindow, ipcMain, nativeTheme, shell, dialog } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Backend imports - Models
import {
  getAvailableModels,
  fetchModelDetails,
  deleteModel,
  installLocalModel,
  getLocalModels,
  getModelsDir,
  activateModel,
  deactivateModel,
  getModelsDirectory,
  changeModelsDirectory,
  resetModelsDirectory,
} from './src/backend/models/models.js';

// Backend imports - Inference
import { 
  runInference, 
  loadModel, 
  unloadModel, 
  getLoadedModels, 
  getEngineStatus, 
  clearAllModels,
  stopGeneration
} from './src/backend/inference/inference.js';

import { getInferenceConfig } from './src/backend/config.js';
import { getSystemInfo } from './src/backend/system/system-improved.js';

// Backend imports - Storage (modular)
import {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  importProfile,
  exportProfile,
  getChats,
  getChat,
  createChat,
  updateChat,
  appendMessage,
  updateMessage,
  flushMessages,
  deleteMessage,
  deleteChat,
  clearChatMessages,
  searchChats,
  getSettings,
  getSettingsSection,
  updateSettings,
  updateSettingsSection,
  resetSettings,
  resetSettingsSection,
  exportSettings,
  importSettings,
  shutdownStorage,
} from './src/backend/storage/storage-router.js';

dotenv.config();

const isDev = process.env.NODE_ENV === 'development';

// Verify model directory functions are imported
console.log('Model directory functions imported:', {
  getModelsDirectory: typeof getModelsDirectory,
  changeModelsDirectory: typeof changeModelsDirectory,
  resetModelsDirectory: typeof resetModelsDirectory,
});

// Main window reference
let mainWindow = null;

// IPC Handlers – System Information
ipcMain.handle('get-system-info', async () => {
  try {
    const systemInfo = await getSystemInfo(isDev);

    if (!isDev && systemInfo.isMock) {
      console.warn('Warning: System is returning mock data in production.');
      return {
        error: 'Cannot extract system info: Mock data detected in production',
        platform: process.platform,
        arch: process.arch,
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
      memory: { formatted: { total: 'Cannot extract system info', free: 'Cannot extract system info' } },
      gpu: { name: 'Cannot extract system info', hasCuda: false, formatted: { vram: 'N/A' } },
    };
  }
});

ipcMain.handle('get-paths', () => ({
  appData: app.getPath('appData'),
  userData: app.getPath('userData'),
  temp: app.getPath('temp'),
  downloads: app.getPath('downloads'),
  documents: app.getPath('documents'),
}));

// IPC Handlers – Model Management
ipcMain.handle('get-available-models', async (_, options) => {
  try {
    return await getAvailableModels(options);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fetch-model-details', async (_, modelId) => {
  try {
    return await fetchModelDetails(modelId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-model', async (_, modelId) => {
  try {
    return await deleteModel(modelId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('activate-model', async (_, modelId) => {
  try {
    return await activateModel(modelId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('deactivate-model', async (_, modelId) => {
  try {
    return await deactivateModel(modelId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-local-models', async () => {
  try {
    return await getLocalModels();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-local-model', async () => {
  try {
    return await installLocalModel();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-models-folder', async () => {
  try {
    const modelDir = getModelsDir();
    await shell.openPath(modelDir);
    return { success: true };
  } catch (err) {
    console.error('Failed to open models folder:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-models-directory', async () => {
  try {
    return await getModelsDirectory();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('change-models-directory', async () => {
  try {
    console.log('change-models-directory IPC handler called');
    const result = await changeModelsDirectory();
    console.log('changeModelsDirectory result:', result);
    return result;
  } catch (err) {
    console.error('Error in change-models-directory handler:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('reset-models-directory', async () => {
  try {
    return await resetModelsDirectory();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handlers – Inference
ipcMain.handle('load-model', async (_, modelId, config) => {
  try {
    return await loadModel(modelId, config);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('unload-model', async (_, modelId) => {
  try {
    return await unloadModel(modelId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-loaded-models', async () => {
  try {
    return getLoadedModels();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-engine-status', async () => {
  try {
    return await getEngineStatus();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('clear-all-models', async () => {
  try {
    return await clearAllModels();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('run-inference', async (event, { modelId, message, config }) => {
  try {
    // Helper to send progress logs to frontend
    const sendLog = (log) => {
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send('inference-log', log);
      }
    };
    
    // Send initial log
    sendLog('🚀 Starting inference...');
    sendLog(`📦 Model: ${modelId}`);
    
    // Intercept console.log during inference
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      const logMessage = args.join(' ');
      // Filter and send relevant logs to frontend with better formatting
      if (
        logMessage.includes('Loading model:') ||
        logMessage.includes('Model loaded:') ||
        logMessage.includes('Detected model type:') ||
        logMessage.includes('engine initialized') ||
        logMessage.includes('Template') ||
        logMessage.includes('Running inference') ||
        logMessage.includes('TemplateRegistry') ||
        logMessage.includes('Matched') ||
        logMessage.includes('Generating response') ||
        logMessage.includes('Generation parameters')
      ) {
        // Clean up and format the log message
        const cleanLog = logMessage
          .replace(/^\[.*?\]\s*/, '') // Remove timestamp prefixes
          .replace(/\s+/g, ' ')       // Normalize whitespace
          .trim();
        
        if (cleanLog.length > 0) {
          sendLog(cleanLog);
        }
      }
      // Still call original console.log
      originalLog(...args);
    };
    
    console.warn = (...args) => {
      const logMessage = args.join(' ');
      if (logMessage.includes('control-looking token') || logMessage.includes('special_eos_id')) {
        // These are informational warnings from llama.cpp - send to UI
        sendLog(`⚠️ ${logMessage.substring(0, 80)}`);
      }
      originalWarn(...args);
    };
    
    // Merge incoming config with stored settings
    // Incoming config from frontend takes priority over stored settings
    const storedConfig = await getInferenceConfig();
    const inferenceConfig = { ...storedConfig, ...config };
    
    sendLog('⚙️ Configuration validated');
    sendLog('🔄 Processing...');
    
    const result = await runInference(modelId, message, inferenceConfig);
    
    // Restore original console functions
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    
    if (result.success) {
      sendLog('✅ Response generated successfully');
    }
    
    return result;
  } catch (err) {
    console.error('Inference error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-generation', async (_, { generationId }) => {
  try {
    return stopGeneration(generationId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handlers – Storage: Profiles
ipcMain.handle('storage:get-profiles', async () => {
  try {
    console.log('IPC: storage:get-profiles called');
    const result = await getProfiles();
    console.log('IPC: storage:get-profiles result:', result);
    return result;
  } catch (err) {
    console.error('IPC: storage:get-profiles error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:get-profile', async (_, profileId) => {
  try {
    return await getProfile(profileId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:create-profile', async (_, profileData) => {
  try {
    return await createProfile(profileData);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:update-profile', async (_, profileId, updates) => {
  try {
    return await updateProfile(profileId, updates);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:delete-profile', async (_, profileId) => {
  try {
    return await deleteProfile(profileId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:import-profile', async (_, filePath) => {
  try {
    return await importProfile(filePath);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:export-profile', async (_, profileId, exportPath) => {
  try {
    return await exportProfile(profileId, exportPath);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Custom Import/Export with Dialog and Encryption
const ENCRYPTION_KEY = 'gecko-chatbot-profile-key-2025'; // You should use a more secure key management

function encrypt(text) {
  const algorithm = 'aes-256-ctr';
  const secretKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(hash) {
  const algorithm = 'aes-256-ctr';
  const secretKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const parts = hash.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

ipcMain.handle('import-profile', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Profile',
      filters: [
        { name: 'Profile Files', extensions: ['profile'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, error: 'Import canceled' };
    }

    const filePath = result.filePaths[0];
    
    // Read and decrypt the file
    const encryptedData = fs.readFileSync(filePath, 'utf8');
    let profileData;
    
    try {
      // Try to decrypt (for encrypted files)
      const decryptedData = decrypt(encryptedData);
      profileData = JSON.parse(decryptedData);
    } catch (decryptErr) {
      // If decryption fails, try parsing as plain JSON (backwards compatibility)
      try {
        profileData = JSON.parse(encryptedData);
      } catch (parseErr) {
        throw new Error('Invalid profile file format');
      }
    }
    
    // Validate structure
    if (!profileData.profile) {
      throw new Error('Invalid profile data structure');
    }
    
    // Import using the backend function
    // First write the decrypted data to a temp location
    const tempPath = path.join(app.getPath('temp'), 'temp-profile-import.json');
    fs.writeFileSync(tempPath, JSON.stringify(profileData), 'utf8');
    
    const importResult = await importProfile(tempPath);
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupErr) {
      console.warn('Failed to clean up temp file:', cleanupErr);
    }
    
    return importResult;
  } catch (err) {
    console.error('Failed to import profile:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-profile', async (_, profileId) => {
  try {
    // Get profile data
    const profileResult = await getProfile(profileId);
    if (!profileResult.success) {
      return { success: false, error: 'Profile not found' };
    }

    const profile = profileResult.profile;
    
    // Get all chats for this profile
    const chatsResult = await getChats(profileId);
    const chats = chatsResult.chats || [];
    
    // Get settings
    const settingsResult = await getSettings();
    const settings = settingsResult.settings || {};
    
    // Combine all data
    const exportData = {
      profile,
      chats,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Profile',
      defaultPath: `${profile.name.toLowerCase().replace(/\s+/g, '-')}.profile`,
      filters: [
        { name: 'Profile Files', extensions: ['profile'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Export canceled' };
    }

    // Encrypt and save
    const dataString = JSON.stringify(exportData, null, 2);
    const encryptedData = encrypt(dataString);
    fs.writeFileSync(result.filePath, encryptedData, 'utf8');
    
    return { success: true, exportPath: result.filePath };
  } catch (err) {
    console.error('Failed to export profile:', err);
    return { success: false, error: err.message };
  }
});

// IPC Handlers – Storage: Chats
ipcMain.handle('storage:get-chats', async (_, profileId) => {
  try {
    return await getChats(profileId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:get-chat', async (_, chatId) => {
  try {
    return await getChat(chatId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:create-chat', async (_, chatData) => {
  try {
    return await createChat(chatData);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:update-chat', async (_, chatId, updates) => {
  try {
    return await updateChat(chatId, updates);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:append-message', async (_, chatId, message) => {
  try {
    return await appendMessage(chatId, message);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:update-message', async (_, chatId, messageId, content) => {
  try {
    return await updateMessage(chatId, messageId, content);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:flush-messages', async (_, chatId) => {
  try {
    return await flushMessages(chatId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:delete-message', async (_, chatId, messageId) => {
  try {
    return await deleteMessage(chatId, messageId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:delete-chat', async (_, chatId) => {
  try {
    return await deleteChat(chatId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:clear-chat-messages', async (_, chatId) => {
  try {
    return await clearChatMessages(chatId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:search-chats', async (_, query, profileId) => {
  try {
    return await searchChats(query, profileId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handlers – Storage: Settings
ipcMain.handle('storage:get-settings', async () => {
  try {
    return await getSettings();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:get-settings-section', async (_, section) => {
  try {
    return await getSettingsSection(section);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:update-settings', async (_, settings) => {
  try {
    return await updateSettings(settings);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:update-settings-section', async (_, section, values) => {
  try {
    return await updateSettingsSection(section, values);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:reset-settings', async () => {
  try {
    return await resetSettings();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:reset-settings-section', async (_, section) => {
  try {
    return await resetSettingsSection(section);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:export-settings', async (_, exportPath) => {
  try {
    return await exportSettings(exportPath);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('storage:import-settings', async (_, importPath) => {
  try {
    return await importSettings(importPath);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handlers – Legacy Chat History (for backward compatibility)
ipcMain.handle('get-chat-history', async () => {
  try {
    const result = await getChats();
    return result.chats || [];
  } catch (err) {
    return [];
  }
});

ipcMain.handle('save-chat', async (_, chat) => {
  try {
    return await createChat(chat);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-chat', async (_, chatId) => {
  try {
    return await deleteChat(chatId);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handlers – Legacy Settings (for backward compatibility)
ipcMain.handle('get-settings', async () => {
  try {
    const result = await getSettings();
    return result.settings?.general || {};
  } catch (err) {
    return {};
  }
});

ipcMain.handle('save-settings', async (_, settings) => {
  try {
    return await updateSettings({ general: settings });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-chat-settings', async () => {
  try {
    const result = await getSettingsSection('chat');
    return result.settings || {
      historyEnabled: true,
      maxHistoryLength: 100,
      temperature: 0.7,
      maxTokens: 1000,
    };
  } catch (err) {
    return {
      historyEnabled: true,
      maxHistoryLength: 100,
      temperature: 0.7,
      maxTokens: 1000,
    };
  }
});

ipcMain.handle('save-chat-settings', async (_, settings) => {
  try {
    return await updateSettingsSection('chat', settings);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-performance-settings', async () => {
  try {
    const result = await getSettingsSection('performance');
    return result.settings || {
      threads: Math.max(1, os.cpus().length - 1),
      batchSize: 512,
      contextSize: 2048,
    };
  } catch (err) {
    return {
      threads: Math.max(1, os.cpus().length - 1),
      batchSize: 512,
      contextSize: 2048,
    };
  }
});

ipcMain.handle('save-performance-settings', async (_, settings) => {
  try {
    return await updateSettingsSection('performance', settings);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC – Navigation
ipcMain.on('navigate-to-chat', (event, modelId) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('navigate', `/chat?model=${modelId}`);
  }
});

// Window Management
async function createWindow() {
  // Platform-specific icon paths
  let iconPath;
  if (process.platform === 'win32') {
    iconPath = path.join(app.getAppPath(), 'public', 'gecko.ico');
  } else if (process.platform === 'darwin') {
    iconPath = path.join(app.getAppPath(), 'public', 'gecko.icns');
  } else {
    iconPath = path.join(app.getAppPath(), 'public', 'gecko.png');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  if (isDev) {
    const devServerURL = process.env.DEV_URL || 'http://localhost:5173';

    // Wait for Vite dev server to start before loading
    const tryLoad = async (retries = 20) => {
      for (let i = 0; i < retries; i++) {
        try {
          await fetch(devServerURL);
          await mainWindow.loadURL(devServerURL);
          console.log('  Loaded Vite dev server:', devServerURL);
          return;
        } catch (err) {
          console.log('Waiting for Vite to start...');
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      console.error('  Could not reach Vite dev server after waiting');
    };

    await tryLoad();
  } else {
    await mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  // Handle theme updates
  nativeTheme.on('updated', () => {
    mainWindow.webContents.send('theme-updated', {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    });
  });

  return mainWindow;
}

// App lifecycle
app.whenReady().then(async () => {
  await createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Flush all pending writes before quitting
  await shutdownStorage();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit - ensure clean shutdown
app.on('before-quit', async (event) => {
  event.preventDefault();
  await shutdownStorage();
  app.exit(0);
});