// C:\Users\mahmu\Desktop\final\lama\equators-chatbot\src\backend\storage\chat-storage.js

import {
  getStorageFilePath,
  readJSON,
  writeJSON,
  generateId,
  getTimestamp,
  successResponse,
  errorResponse,
} from './storage.js';

const CHATS_FILE = 'chats.json';

// Get all chats (optionally filtered by profile)
export async function getChats(profileId = null) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    let chats = data.chats || [];
    
    // Filter by profile if specified
    if (profileId) {
      chats = chats.filter(chat => chat.profileId === profileId);
    }
    
    return successResponse({ chats });
  } catch (err) {
    return errorResponse(err);
  }
}

// Get single chat by ID
export async function getChat(chatId) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const chat = data.chats.find(c => c.id === chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    return successResponse({ chat });
  } catch (err) {
    return errorResponse(err);
  }
}

// Create new chat
export async function createChat(chatData) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const newChat = {
      id: generateId(),
      title: chatData.title || 'New Chat',
      modelId: chatData.modelId || null,
      profileId: chatData.profileId || null,
      messages: chatData.messages || [],
      metadata: chatData.metadata || {},
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      ...chatData,
    };
    
    data.chats.push(newChat);
    writeJSON(filePath, data);
    
    return successResponse({ chat: newChat });
  } catch (err) {
    return errorResponse(err);
  }
}

// Update chat (title, metadata, etc.)
export async function updateChat(chatId, updates) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const chatIndex = data.chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      throw new Error('Chat not found');
    }
    
    // Merge updates but keep messages separate
    const currentChat = data.chats[chatIndex];
    data.chats[chatIndex] = {
      ...currentChat,
      ...updates,
      id: chatId,
      messages: currentChat.messages,
      updatedAt: getTimestamp(),
    };
    
    writeJSON(filePath, data);
    
    return successResponse({ chat: data.chats[chatIndex] });
  } catch (err) {
    return errorResponse(err);
  }
}

// Append message to chat
export async function appendMessage(chatId, message) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const chat = data.chats.find(c => c.id === chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    const newMessage = {
      id: generateId(),
      role: message.role || 'user',
      content: message.content || '',
      timestamp: getTimestamp(),
      metadata: message.metadata || {},
      ...message,
    };
    
    chat.messages.push(newMessage);
    chat.updatedAt = getTimestamp();
    
    writeJSON(filePath, data);
    
    return successResponse({ message: newMessage, chat });
  } catch (err) {
    return errorResponse(err);
  }
}

// Delete specific message from chat
export async function deleteMessage(chatId, messageId) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const chat = data.chats.find(c => c.id === chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    const initialLength = chat.messages.length;
    chat.messages = chat.messages.filter(m => m.id !== messageId);
    
    if (chat.messages.length === initialLength) {
      throw new Error('Message not found');
    }
    
    chat.updatedAt = getTimestamp();
    writeJSON(filePath, data);
    
    return successResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Delete entire chat
export async function deleteChat(chatId) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const initialLength = data.chats.length;
    data.chats = data.chats.filter(c => c.id !== chatId);
    
    if (data.chats.length === initialLength) {
      throw new Error('Chat not found');
    }
    
    writeJSON(filePath, data);
    
    return successResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Clear all messages from chat
export async function clearChatMessages(chatId) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const chat = data.chats.find(c => c.id === chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    chat.messages = [];
    chat.updatedAt = getTimestamp();
    
    writeJSON(filePath, data);
    
    return successResponse({ chat });
  } catch (err) {
    return errorResponse(err);
  }
}

// Search chats by title or content
export async function searchChats(query, profileId = null) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    let chats = data.chats || [];
    
    // Filter by profile if specified
    if (profileId) {
      chats = chats.filter(chat => chat.profileId === profileId);
    }
    
    // Search by title or message content
    const searchQuery = query.toLowerCase();
    const results = chats.filter(chat => {
      const titleMatch = chat.title.toLowerCase().includes(searchQuery);
      const messageMatch = chat.messages.some(msg => 
        msg.content.toLowerCase().includes(searchQuery)
      );
      return titleMatch || messageMatch;
    });
    
    return successResponse({ chats: results });
  } catch (err) {
    return errorResponse(err);
  }
}