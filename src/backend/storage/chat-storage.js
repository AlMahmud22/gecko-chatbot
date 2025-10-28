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
    console.log('[ChatStorage] getChat - chatId:', chatId);
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    console.log('[ChatStorage] getChat - Total chats in file:', data.chats.length);
    
    const chat = data.chats.find(c => c.id === chatId);
    if (!chat) {
      console.error('[ChatStorage] getChat - Chat not found:', chatId);
      throw new Error('Chat not found');
    }
    
    console.log('[ChatStorage] getChat - Chat found:', {
      id: chat.id,
      title: chat.title,
      messagesCount: chat.messages?.length || 0,
      messages: chat.messages?.map(m => ({ role: m.role, contentLength: m.content?.length }))
    });
    
    return successResponse({ chat });
  } catch (err) {
    console.error('[ChatStorage] getChat - Error:', err);
    return errorResponse(err);
  }
}

// Create new chat
export async function createChat(chatData) {
  try {
    console.log('[ChatStorage] createChat - Input data:', JSON.stringify(chatData, null, 2));
    const filePath = getStorageFilePath(CHATS_FILE);
    const data = readJSON(filePath, { chats: [] });
    
    console.log('[ChatStorage] createChat - Current chats count:', data.chats.length);
    
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
    
    console.log('[ChatStorage] createChat - New chat object:', JSON.stringify({
      id: newChat.id,
      title: newChat.title,
      modelId: newChat.modelId,
      profileId: newChat.profileId,
      messagesCount: newChat.messages.length
    }, null, 2));
    
    data.chats.push(newChat);
    console.log('[ChatStorage] createChat - After push, chats count:', data.chats.length);
    
    await writeJSONSafe(filePath, data);
    console.log('[ChatStorage] createChat - Write completed');
    
    // Verify the write
    const verifyData = readJSON(filePath, { chats: [] });
    const chatExists = verifyData.chats.some(c => c.id === newChat.id);
    console.log('[ChatStorage] createChat - Chat exists in file:', chatExists);
    
    if (!chatExists) {
      throw new Error('Chat was not saved to file - verification failed');
    }
    
    return successResponse({ chat: newChat });
  } catch (err) {
    console.error('[ChatStorage] createChat - Error:', err);
    console.error('[ChatStorage] createChat - Error stack:', err.stack);
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
    console.log('[ChatStorage] appendMessage - chatId:', chatId);
    console.log('[ChatStorage] appendMessage - message:', JSON.stringify(message, null, 2));
    
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
    
    console.log('[ChatStorage] appendMessage - New message object:', JSON.stringify(newMessage, null, 2));
    
    if (useWAL) {
      // Buffer in WAL for streaming scenarios
      messageWAL.buffer(chatId, newMessage);
      console.log('[ChatStorage] appendMessage - Buffered in WAL');
      return successResponse({ message: newMessage, buffered: true });
    } else {
      // Direct write for immediate persistence - atomic operation
      const filePath = getStorageFilePath(CHATS_FILE);
      console.log('[ChatStorage] appendMessage - Reading from file:', filePath);
      
      const data = readJSON(filePath, { chats: [] });
      console.log('[ChatStorage] appendMessage - Current chats count:', data.chats.length);
      
      const chat = data.chats.find(c => c.id === chatId);
      if (!chat) {
        console.error('[ChatStorage] appendMessage - Chat not found:', chatId);
        throw new Error('Chat not found');
      }
      
      console.log('[ChatStorage] appendMessage - Chat found, current messages count:', chat.messages.length);
      
      chat.messages.push(newMessage);
      chat.updatedAt = getTimestamp();
      
      console.log('[ChatStorage] appendMessage - After push, messages count:', chat.messages.length);
      console.log('[ChatStorage] appendMessage - Calling writeJSONSafe...');
      
      // Atomic write with flush - wait for completion
      await writeJSONSafe(filePath, data);
      
      console.log('[ChatStorage] appendMessage - Write completed');
      
      // Verify the write by reading back
      const verifyData = readJSON(filePath, { chats: [] });
      const verifyChat = verifyData.chats.find(c => c.id === chatId);
      console.log('[ChatStorage] appendMessage - Verification: messages count after write:', verifyChat?.messages.length);
      
      const messageExists = verifyChat?.messages.some(m => m.id === newMessage.id);
      console.log('[ChatStorage] appendMessage - Message exists in file:', messageExists);
      
      if (!messageExists) {
        throw new Error('Message was not saved to file - verification failed');
      }
      
      return successResponse({ message: newMessage, chat });
    }
  } catch (err) {
    console.error('[ChatStorage] appendMessage - Error:', err);
    console.error('[ChatStorage] appendMessage - Error stack:', err.stack);
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