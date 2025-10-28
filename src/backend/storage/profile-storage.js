// Profile Storage Module

import fs from 'fs';
import {
  getStorageFilePath,
  readJSON,
  writeJSON,
  writeJSONSafe,
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
    console.log('getProfiles - Reading from:', filePath);
    const data = readJSON(filePath, { profiles: [] });
    console.log('getProfiles - Data read:', data);
    return successResponse({ profiles: data.profiles || [] });
  } catch (err) {
    console.error('getProfiles - Error:', err);
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
    console.log('[ProfileStorage] createProfile - Input data:', JSON.stringify(profileData, null, 2));
    const filePath = getStorageFilePath(PROFILES_FILE);
    console.log('[ProfileStorage] createProfile - File path:', filePath);
    
    const data = readJSON(filePath, { profiles: [] });
    console.log('[ProfileStorage] createProfile - Current data:', JSON.stringify(data, null, 2));
    
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
    
    console.log('[ProfileStorage] createProfile - New profile object:', JSON.stringify(newProfile, null, 2));
    
    data.profiles.push(newProfile);
    console.log('[ProfileStorage] createProfile - Data after push (profiles count):', data.profiles.length);
    
    console.log('[ProfileStorage] createProfile - Calling writeJSONSafe...');
    const writeSuccess = await writeJSONSafe(filePath, data);
    console.log('[ProfileStorage] createProfile - Write completed, success:', writeSuccess);
    
    // Verify the write by reading back
    const verifyData = readJSON(filePath, { profiles: [] });
    console.log('[ProfileStorage] createProfile - Verification read (profiles count):', verifyData.profiles.length);
    const profileExists = verifyData.profiles.some(p => p.id === newProfile.id);
    console.log('[ProfileStorage] createProfile - Profile exists in file:', profileExists);
    
    if (!profileExists) {
      throw new Error('Profile was not saved to file - verification failed');
    }
    
    return successResponse({ profile: newProfile });
  } catch (err) {
    console.error('[ProfileStorage] createProfile - Error:', err);
    console.error('[ProfileStorage] createProfile - Error stack:', err.stack);
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
    
    await writeJSONSafe(filePath, data); // Use safe write
    
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
    
    await writeJSONSafe(filePath, data); // Use safe write
    
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
    
    // Validate profile data structure
    if (!profileData.profile) {
      throw new Error('Invalid profile file format');
    }
    
    // Create new profile with imported data (generate new ID)
    const newProfile = {
      ...profileData.profile,
      id: generateId(),
      importedAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };
    
    const storageFile = getStorageFilePath(PROFILES_FILE);
    const data = readJSON(storageFile, { profiles: [] });
    data.profiles.push(newProfile);
    await writeJSONSafe(storageFile, data); // Use safe write
    
    // Import chats if available
    if (profileData.chats && Array.isArray(profileData.chats)) {
      const chatsFilePath = getStorageFilePath('chats.json');
      const chatsData = readJSON(chatsFilePath, { chats: [] });
      
      // Update chat profileIds to new profile ID
      const importedChats = profileData.chats.map(chat => ({
        ...chat,
        id: generateId(),
        profileId: newProfile.id,
        importedAt: getTimestamp(),
      }));
      
      chatsData.chats.push(...importedChats);
      await writeJSONSafe(chatsFilePath, chatsData); // Use safe write
    }
    
    // Import settings if available (merge with existing)
    if (profileData.settings) {
      const settingsFilePath = getStorageFilePath('settings.json');
      const currentSettings = readJSON(settingsFilePath, {});
      const mergedSettings = {
        ...currentSettings,
        ...profileData.settings,
        updatedAt: getTimestamp(),
      };
      await writeJSONSafe(settingsFilePath, mergedSettings); // Use safe write
    }
    
    return successResponse({ profile: newProfile });
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