// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\storage\storage-router.js

import { initializeStorage } from './storage.js';
import * as ProfileStorage from './profile-storage.js';
import * as ChatStorage from './chat-storage.js';
import * as SettingsStorage from './settings-storage.js';

// Initialize storage on first import
initializeStorage();

// Profile Management Exports
export const getProfiles = ProfileStorage.getProfiles;
export const getProfile = ProfileStorage.getProfile;
export const createProfile = ProfileStorage.createProfile;
export const updateProfile = ProfileStorage.updateProfile;
export const deleteProfile = ProfileStorage.deleteProfile;
export const importProfile = ProfileStorage.importProfile;
export const exportProfile = ProfileStorage.exportProfile;

// Chat Management Exports
export const getChats = ChatStorage.getChats;
export const getChat = ChatStorage.getChat;
export const createChat = ChatStorage.createChat;
export const updateChat = ChatStorage.updateChat;
export const appendMessage = ChatStorage.appendMessage;
export const deleteMessage = ChatStorage.deleteMessage;
export const deleteChat = ChatStorage.deleteChat;
export const clearChatMessages = ChatStorage.clearChatMessages;
export const searchChats = ChatStorage.searchChats;

// Settings Management Exports
export const getSettings = SettingsStorage.getSettings;
export const getSettingsSection = SettingsStorage.getSettingsSection;
export const updateSettings = SettingsStorage.updateSettings;
export const updateSettingsSection = SettingsStorage.updateSettingsSection;
export const resetSettings = SettingsStorage.resetSettings;
export const resetSettingsSection = SettingsStorage.resetSettingsSection;
export const exportSettings = SettingsStorage.exportSettings;
export const importSettings = SettingsStorage.importSettings;