// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\storage\storage.js

import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import crypto from 'crypto';

// Get main storage directory
export function getStorageDir() {
  const userDataPath = app.getPath('userData');
  const storageDir = path.join(userDataPath, 'storage');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  return storageDir;
}

// Get path for a specific storage file
export function getStorageFilePath(filename) {
  const storageDir = getStorageDir();
  return path.join(storageDir, filename);
}

// Read JSON file with default value
export function readJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Write JSON file
export function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Generate unique ID
export function generateId() {
  return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// Get current timestamp
export function getTimestamp() {
  return new Date().toISOString();
}

// Safe response wrapper
export function successResponse(data = {}) {
  return { success: true, ...data };
}

export function errorResponse(error) {
  const message = error instanceof Error ? error.message : String(error);
  return { success: false, error: message };
}

// Ensure storage directory exists
export function initializeStorage() {
  try {
    const storageDir = getStorageDir();
    console.log(`Storage initialized at: ${storageDir}`);
    return true;
  } catch (err) {
    console.error('Failed to initialize storage:', err);
    return false;
  }
}