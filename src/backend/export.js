const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const storage = require('./storage');
const logger = require('./logger');

async function exportChat(chatId, format) {
  try {
    let chat;
    if (storage.db.chats) {
      chat = storage.db.chats.find((c) => c.id === chatId);
    } else {
      chat = await storage.db.collection('chats').findOne({ id: chatId });
    }

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (!['txt', 'json'].includes(format)) {
      throw new Error('Invalid format. Use "txt" or "json".');
    }

    const exportPath = path.join(app.getPath('downloads'), `chat_${chatId}.${format}`);
    
    if (format === 'txt') {
      const content = chat.messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      fs.writeFileSync(exportPath, content);
    } else if (format === 'json') {
      fs.writeFileSync(exportPath, JSON.stringify(chat, null, 2));
    }

    return exportPath;
  } catch (err) {
    logger.error('Failed to export chat:', err.message);
    return null;
  }
}

module.exports = { exportChat };