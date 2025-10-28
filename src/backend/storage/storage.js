// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\storage\storage.js

import fs from 'fs';
// Storage Core Module
import path from 'path';
import { app } from 'electron';
import crypto from 'crypto';

// Write queue to prevent race conditions
const writeQueue = new Map();
const pendingWrites = new Map();

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

// Get WAL (Write-Ahead Log) path for streaming buffer
function getWALPath(filePath) {
  return `${filePath}.wal`;
}

// Get backup path for file
function getBackupPath(filePath) {
  return `${filePath}.backup`;
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
    // Try backup if main file is corrupted
    try {
      const backupPath = getBackupPath(filePath);
      if (fs.existsSync(backupPath)) {
        console.log(`Recovering from backup: ${backupPath}`);
        const backupData = fs.readFileSync(backupPath, 'utf8');
        return JSON.parse(backupData);
      }
    } catch (backupErr) {
      console.error(`Backup recovery failed:`, backupErr);
    }
    return defaultValue;
  }
}

// Atomic write with backup and verification
export function writeJSON(filePath, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create backup of existing file before overwriting
    if (fs.existsSync(filePath)) {
      const backupPath = getBackupPath(filePath);
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (backupErr) {
        console.warn(`Failed to create backup: ${backupErr.message}`);
      }
    }
    
    // Write to temporary file first (atomic operation)
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, jsonString, 'utf8');
    
    // Verify temp file was written correctly
    const written = fs.readFileSync(tempPath, 'utf8');
    const parsed = JSON.parse(written);
    
    // Atomic rename (replace original)
    fs.renameSync(tempPath, filePath);
    
    // Verify final file
    const verified = fs.readFileSync(filePath, 'utf8');
    JSON.parse(verified); // Ensure it's valid JSON
    
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Async version with queue to prevent race conditions
export async function writeJSONSafe(filePath, data) {
  // Serialize writes to same file
  if (!writeQueue.has(filePath)) {
    writeQueue.set(filePath, Promise.resolve());
  }
  
  const currentQueue = writeQueue.get(filePath);
  
  const writePromise = currentQueue.then(() => {
    return new Promise((resolve, reject) => {
      try {
        const success = writeJSON(filePath, data);
        if (success) {
          resolve(true);
        } else {
          reject(new Error('Write failed'));
        }
      } catch (err) {
        reject(err);
      }
    });
  });
  
  writeQueue.set(filePath, writePromise);
  
  try {
    return await writePromise;
  } catch (err) {
    console.error(`Queued write failed for ${filePath}:`, err);
    throw err;
  }
}

// WAL (Write-Ahead Log) for streaming messages
class MessageWAL {
  constructor() {
    this.buffers = new Map(); // chatId -> { messages: [], lastFlush: timestamp }
    this.flushInterval = 2000; // Flush every 2 seconds
    this.autoFlushTimer = null;
    this.startAutoFlush();
  }
  
  // Start auto-flush timer
  startAutoFlush() {
    if (this.autoFlushTimer) return;
    this.autoFlushTimer = setInterval(() => {
      this.flushAll();
    }, this.flushInterval);
  }
  
  // Stop auto-flush (on app shutdown)
  stopAutoFlush() {
    if (this.autoFlushTimer) {
      clearInterval(this.autoFlushTimer);
      this.autoFlushTimer = null;
    }
  }
  
  // Buffer a message (for streaming or rapid writes)
  buffer(chatId, message) {
    if (!this.buffers.has(chatId)) {
      this.buffers.set(chatId, {
        messages: [],
        lastFlush: Date.now()
      });
    }
    
    const buffer = this.buffers.get(chatId);
    buffer.messages.push(message);
    
    // Write to WAL file immediately
    const walPath = getWALPath(getStorageFilePath('chats.json'));
    try {
      const walData = {
        chatId,
        messages: buffer.messages,
        timestamp: Date.now()
      };
      fs.writeFileSync(walPath, JSON.stringify(walData, null, 2), 'utf8');
    } catch (err) {
      console.error(`WAL write failed for chat ${chatId}:`, err);
    }
  }
  
  // Flush buffered messages for a specific chat
  async flush(chatId) {
    if (!this.buffers.has(chatId)) return;
    
    const buffer = this.buffers.get(chatId);
    if (buffer.messages.length === 0) return;
    
    try {
      const filePath = getStorageFilePath('chats.json');
      const data = readJSON(filePath, { chats: [] });
      const chat = data.chats.find(c => c.id === chatId);
      
      if (!chat) {
        console.warn(`Chat ${chatId} not found during WAL flush`);
        return;
      }
      
      // Append all buffered messages
      chat.messages.push(...buffer.messages);
      chat.updatedAt = new Date().toISOString();
      
      // Write atomically
      await writeJSONSafe(filePath, data);
      
      // Clear buffer after successful write
      this.buffers.delete(chatId);
      
      // Clear WAL file
      const walPath = getWALPath(filePath);
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath);
      }
      
      console.log(`Flushed ${buffer.messages.length} messages for chat ${chatId}`);
    } catch (err) {
      console.error(`Failed to flush WAL for chat ${chatId}:`, err);
      throw err;
    }
  }
  
  // Flush all buffered messages
  async flushAll() {
    const chatIds = Array.from(this.buffers.keys());
    for (const chatId of chatIds) {
      try {
        await this.flush(chatId);
      } catch (err) {
        console.error(`Error flushing chat ${chatId}:`, err);
      }
    }
  }
  
  // Recover messages from WAL on startup
  recover() {
    const walPath = getWALPath(getStorageFilePath('chats.json'));
    if (!fs.existsSync(walPath)) return;
    
    try {
      const walData = JSON.parse(fs.readFileSync(walPath, 'utf8'));
      console.log(`Recovering ${walData.messages.length} messages from WAL for chat ${walData.chatId}`);
      
      const filePath = getStorageFilePath('chats.json');
      const data = readJSON(filePath, { chats: [] });
      const chat = data.chats.find(c => c.id === walData.chatId);
      
      if (chat) {
        // Filter out duplicates based on timestamp
        const existingTimestamps = new Set(chat.messages.map(m => m.timestamp));
        const newMessages = walData.messages.filter(m => !existingTimestamps.has(m.timestamp));
        
        if (newMessages.length > 0) {
          chat.messages.push(...newMessages);
          chat.updatedAt = new Date().toISOString();
          writeJSON(filePath, data);
          console.log(`Recovered ${newMessages.length} messages from WAL`);
        }
      }
      
      // Clear WAL after recovery
      fs.unlinkSync(walPath);
    } catch (err) {
      console.error('WAL recovery failed:', err);
    }
  }
}

// Global WAL instance
export const messageWAL = new MessageWAL();

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
    
    // Recover any pending writes from WAL
    messageWAL.recover();
    
    return true;
  } catch (err) {
    console.error('Failed to initialize storage:', err);
    return false;
  }
}

// Graceful shutdown - flush all pending writes
export async function shutdownStorage() {
  try {
    console.log('Flushing pending writes before shutdown...');
    messageWAL.stopAutoFlush();
    await messageWAL.flushAll();
    console.log('Storage shutdown complete');
  } catch (err) {
    console.error('Error during storage shutdown:', err);
  }
}