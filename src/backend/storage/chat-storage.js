// Chat Storage Module
import {
  getStorageFilePath,
  readJSON,
  writeJSON,
  writeJSONSafe,
  messageWAL,
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
    await writeJSONSafe(filePath, data); // Use safe write
    
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
    
    await writeJSONSafe(filePath, data); // Use safe write
    
    return successResponse({ chat: data.chats[chatIndex] });
  } catch (err) {
    return errorResponse(err);
  }
}

// Append message to chat - with WAL buffering option
export async function appendMessage(chatId, message, options = {}) {
  try {
    const useWAL = options.useWAL || false; // Enable WAL for streaming
    
    // Ensure complete message object with all required fields
    const newMessage = {
      id: message.id || generateId(),
      role: message.role || 'user',
      content: message.content || '',
      model: message.model || 'unknown', // Ensure model field exists
      timestamp: message.timestamp || getTimestamp(),
      metadata: message.metadata || {},
      ...message, // Allow override but ensure defaults are set
    };
    
    if (useWAL) {
      // Buffer in WAL for streaming scenarios
      messageWAL.buffer(chatId, newMessage);
      return successResponse({ message: newMessage, buffered: true });
    } else {
      // Direct write for immediate persistence - atomic operation
      const filePath = getStorageFilePath(CHATS_FILE);
      const data = readJSON(filePath, { chats: [] });
      
      const chat = data.chats.find(c => c.id === chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      chat.messages.push(newMessage);
      chat.updatedAt = getTimestamp();
      
      // Atomic write with flush - wait for completion
      await writeJSONSafe(filePath, data);
      
      return successResponse({ message: newMessage, chat });
    }
  } catch (err) {
    return errorResponse(err);
  }
}

// Flush WAL buffer for a specific chat (call after generation completes)
export async function flushMessages(chatId) {
  try {
    await messageWAL.flush(chatId);
    return successResponse({ flushed: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Update message content (for streaming updates)
export async function updateMessage(chatId, messageId, contentOrUpdates) {
  try {
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    const chat = data.chats.find(c => c.id === chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    const message = chat.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Support both string content and object updates
    if (typeof contentOrUpdates === 'string') {
      message.content = contentOrUpdates;
    } else {
      Object.assign(message, contentOrUpdates);
    }
    
    message.updatedAt = getTimestamp();
    chat.updatedAt = getTimestamp();
    
    // Atomic write - ensure completion before returning
    await writeJSONSafe(filePath, data);
    
    return successResponse({ message, chat });
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
    await writeJSONSafe(filePath, data); // Use safe write
    
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
    
    await writeJSONSafe(filePath, data); // Use safe write
    
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
    
    await writeJSONSafe(filePath, data); // Use safe write
    
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