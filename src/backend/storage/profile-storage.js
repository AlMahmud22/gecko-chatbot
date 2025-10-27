// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\storage\profile-storage.js

import fs from 'fs';
import {
  getStorageFilePath,
  readJSON,
  writeJSON,
  generateId,
  getTimestamp,
  successResponse,
  errorResponse,
} from './storage.js';

const PROFILES_FILE = 'profiles.json';

// Get all profiles
export async function getProfiles() {
  try {
    const filePath = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(filePath, { profiles: [] });
    return successResponse({ profiles: data.profiles || [] });
  } catch (err) {
    return errorResponse(err);
  }
}

// Get single profile by ID
export async function getProfile(profileId) {
  try {
    const filePath = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(filePath, { profiles: [] });
    
    const profile = data.profiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    return successResponse({ profile });
  } catch (err) {
    return errorResponse(err);
  }
}

// Create new profile
export async function createProfile(profileData) {
  try {
    const filePath = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(filePath, { profiles: [] });
    
    const newProfile = {
      id: generateId(),
      name: profileData.name || 'Default Profile',
      description: profileData.description || '',
      avatar: profileData.avatar || null,
      settings: profileData.settings || {},
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      ...profileData,
    };
    
    data.profiles.push(newProfile);
    writeJSON(filePath, data);
    
    return successResponse({ profile: newProfile });
  } catch (err) {
    return errorResponse(err);
  }
}

// Update existing profile
export async function updateProfile(profileId, updates) {
  try {
    const filePath = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(filePath, { profiles: [] });
    
    const profileIndex = data.profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) {
      throw new Error('Profile not found');
    }
    
    // Merge updates
    data.profiles[profileIndex] = {
      ...data.profiles[profileIndex],
      ...updates,
      id: profileId,
      updatedAt: getTimestamp(),
    };
    
    writeJSON(filePath, data);
    
    return successResponse({ profile: data.profiles[profileIndex] });
  } catch (err) {
    return errorResponse(err);
  }
}

// Delete profile
export async function deleteProfile(profileId) {
  try {
    const filePath = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(filePath, { profiles: [] });
    
    const initialLength = data.profiles.length;
    data.profiles = data.profiles.filter(p => p.id !== profileId);
    
    if (data.profiles.length === initialLength) {
      throw new Error('Profile not found');
    }
    
    writeJSON(filePath, data);
    
    return successResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Import profile from file
export async function importProfile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('Profile file not found');
    }
    
    const profileData = readJSON(filePath);
    
    // Create new profile with imported data
    profileData.id = generateId();
    profileData.importedAt = getTimestamp();
    profileData.updatedAt = getTimestamp();
    
    const storageFile = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(storageFile, { profiles: [] });
    data.profiles.push(profileData);
    writeJSON(storageFile, data);
    
    return successResponse({ profile: profileData });
  } catch (err) {
    return errorResponse(err);
  }
}

// Export profile to file
export async function exportProfile(profileId, exportPath) {
  try {
    const filePath = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(filePath, { profiles: [] });
    
    const profile = data.profiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    writeJSON(exportPath, profile);
    
    return successResponse({ exportPath });
  } catch (err) {
    return errorResponse(err);
  }
}