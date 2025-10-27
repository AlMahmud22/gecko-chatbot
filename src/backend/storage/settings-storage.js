// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\storage\settings-storage.js

import os from 'os';
import {
  getStorageFilePath,
  readJSON,
  writeJSON,
  writeJSONSafe,
  getTimestamp,
  successResponse,
  errorResponse,
} from './storage.js';

const SETTINGS_FILE = 'settings.json';

// Default settings structure
function getDefaultSettings() {
  return {
    general: {
      language: 'en',
      autoSave: true,
      notifications: true,
    },
    chat: {
      historyEnabled: true,
      maxHistoryLength: 100,
      temperature: 0.7,
      maxTokens: 1000,
      streamingEnabled: true,
    },
    performance: {
      threads: Math.max(1, os.cpus().length - 1),
      batchSize: 512,
      contextSize: 2048,
      gpuLayers: 0,
    },
    appearance: {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'system-ui',
      compactMode: false,
    },
    privacy: {
      telemetry: false,
      crashReports: false,
    },
    updatedAt: getTimestamp(),
  };
}

// Get all settings (profile-aware)
export async function getSettings(profileId = null) {
  try {
    const baseFileName = profileId ? `settings-${profileId}.json` : SETTINGS_FILE;
    const filePath = getStorageFilePath(baseFileName);
    const settings = readJSON(filePath, getDefaultSettings());
    
    return successResponse({ settings });
  } catch (err) {
    return errorResponse(err);
  }
}

// Get specific settings section (profile-aware)
export async function getSettingsSection(section, profileId = null) {
  try {
    const baseFileName = profileId ? `settings-${profileId}.json` : SETTINGS_FILE;
    const filePath = getStorageFilePath(baseFileName);
    const allSettings = readJSON(filePath, getDefaultSettings());
    
    if (!allSettings[section]) {
      throw new Error(`Settings section '${section}' not found`);
    }
    
    return successResponse({ settings: allSettings[section] });
  } catch (err) {
    return errorResponse(err);
  }
}

// Update settings (deep merge) (profile-aware)
export async function updateSettings(newSettings, profileId = null) {
  try {
    const baseFileName = profileId ? `settings-${profileId}.json` : SETTINGS_FILE;
    const filePath = getStorageFilePath(baseFileName);
    const currentSettings = readJSON(filePath, getDefaultSettings());
    
    // Deep merge settings
    const updatedSettings = {
      ...currentSettings,
      general: { ...currentSettings.general, ...newSettings.general },
      chat: { ...currentSettings.chat, ...newSettings.chat },
      performance: { ...currentSettings.performance, ...newSettings.performance },
      appearance: { ...currentSettings.appearance, ...newSettings.appearance },
      privacy: { ...currentSettings.privacy, ...newSettings.privacy },
      updatedAt: getTimestamp(),
    };
    
    writeJSON(filePath, updatedSettings);
    
    return successResponse({ settings: updatedSettings });
  } catch (err) {
    return errorResponse(err);
  }
}

// Update specific settings section
export async function updateSettingsSection(section, newValues) {
  try {
    const filePath = getStorageFilePath(SETTINGS_FILE);
    const currentSettings = readJSON(filePath, getDefaultSettings());
    
    if (!currentSettings[section]) {
      throw new Error(`Settings section '${section}' not found`);
    }
    
    // Update only the specified section
    currentSettings[section] = {
      ...currentSettings[section],
      ...newValues,
    };
    currentSettings.updatedAt = getTimestamp();
    
    await writeJSONSafe(filePath, currentSettings); // Use safe write
    
    return successResponse({ settings: currentSettings });
  } catch (err) {
    return errorResponse(err);
  }
}

// Reset all settings to defaults
export async function resetSettings() {
  try {
    const filePath = getStorageFilePath(SETTINGS_FILE);
    const defaultSettings = getDefaultSettings();
    defaultSettings.resetAt = getTimestamp();
    
    await writeJSONSafe(filePath, defaultSettings); // Use safe write
    
    return successResponse({ settings: defaultSettings });
  } catch (err) {
    return errorResponse(err);
  }
}

// Reset specific settings section
export async function resetSettingsSection(section) {
  try {
    const filePath = getStorageFilePath(SETTINGS_FILE);
    const currentSettings = readJSON(filePath, getDefaultSettings());
    const defaultSettings = getDefaultSettings();
    
    if (!currentSettings[section]) {
      throw new Error(`Settings section '${section}' not found`);
    }
    
    // Reset only the specified section
    currentSettings[section] = defaultSettings[section];
    currentSettings.updatedAt = getTimestamp();
    
    await writeJSONSafe(filePath, currentSettings); // Use safe write
    
    return successResponse({ settings: currentSettings });
  } catch (err) {
    return errorResponse(err);
  }
}

// Export settings to file
export async function exportSettings(exportPath) {
  try {
    const filePath = getStorageFilePath(SETTINGS_FILE);
    const settings = readJSON(filePath, getDefaultSettings());
    
    await writeJSONSafe(exportPath, settings); // Use safe write
    
    return successResponse({ exportPath });
  } catch (err) {
    return errorResponse(err);
  }
}

// Import settings from file
export async function importSettings(importPath) {
  try {
    const importedSettings = readJSON(importPath);
    
    // Validate imported settings
    if (!importedSettings || typeof importedSettings !== 'object') {
      throw new Error('Invalid settings file');
    }
    
    const filePath = getStorageFilePath(SETTINGS_FILE);
    const currentSettings = readJSON(filePath, getDefaultSettings());
    
    // Merge imported settings with current
    const mergedSettings = {
      ...currentSettings,
      ...importedSettings,
      importedAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };
    
    await writeJSONSafe(filePath, mergedSettings); // Use safe write
    
    return successResponse({ settings: mergedSettings });
  } catch (err) {
    return errorResponse(err);
  }
}