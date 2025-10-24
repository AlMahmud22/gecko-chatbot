const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const logger = require('./logger');

let db;
let isMongoAvailable = false;
let MongoClient;

// Try to import MongoDB, but don't fail if it's not available
try {
  const mongodb = require('mongodb');
  MongoClient = mongodb.MongoClient;
  isMongoAvailable = true;
} catch (err) {
  logger.warn('MongoDB module not available, falling back to JSON storage');
  isMongoAvailable = false;
}

async function connectToDB() {
  try {
    if (!isMongoAvailable) {
      throw new Error('MongoDB module not available');
    }
    
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      useUnifiedTopology: true,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    await client.connect();
    db = client.db('equators-chatbot');
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err);
    db = { 
      chats: [], 
      presets: [],
      installed_models: []  // Add installed_models array for fallback
    };
    loadJSON();
  }
}

function loadJSON() {
  const dataPath = path.join(app.getPath('userData'), 'data.json');
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      db = JSON.parse(data);
    }
  } catch (err) {
    logger.error('Failed to parse JSON data:', err);
    db = { chats: [], presets: [] }; // Initialize empty db on error
  }
}

function saveJSON() {
  const dataPath = path.join(app.getPath('userData'), 'data.json');
  try {
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
  } catch (err) {
    logger.error('Failed to save JSON data:', err);
  }
}

async function getChats() {
  if (db.chats) {
    return db.chats;
  } else {
    try {
      return await db.collection('chats').find().toArray();
    } catch (err) {
      logger.error('Failed to get chats from MongoDB:', err);
      return [];
    }
  }
}

async function saveChat(chat) {
  try {
    if (db.chats) {
      db.chats = db.chats.filter((c) => c.id !== chat.id);
      db.chats.push(chat);
      saveJSON();
    } else {
      await db.collection('chats').updateOne(
        { id: chat.id },
        { $set: chat },
        { upsert: true }
      );
    }
  } catch (err) {
    logger.error('Failed to save chat:', err);
  }
}

async function deleteChat(chatId) {
  try {
    if (db.chats) {
      db.chats = db.chats.filter((c) => c.id !== chatId);
      saveJSON();
    } else {
      await db.collection('chats').deleteOne({ id: chatId });
    }
  } catch (err) {
    logger.error('Failed to delete chat:', err);
  }
}

async function getInstalledModels() {
  if (isMongoAvailable && db.collection) {
    try {
      return await db.collection('installed_models').find().toArray();
    } catch (err) {
      logger.error('Failed to get installed models from MongoDB:', err);
      return [];
    }
  } else {
    // Fallback to JSON storage
    return db.installed_models || [];
  }
}

async function saveInstalledModel(modelData) {
  try {
    // Ensure all required fields are present
    const completeModelData = {
      _id: modelData._id,
      name: modelData.name || modelData._id.replace('.gguf', ''),
      filePath: modelData.filePath,
      downloadedAt: modelData.downloadedAt || new Date(),
      size: modelData.size || 0,
      quant: modelData.quant || 'Unknown',
      parameters: modelData.parameters || 'Unknown',
      description: modelData.description || `Local model: ${modelData.name || modelData._id.replace('.gguf', '')}`,
      tags: modelData.tags || ['local'],
      license: modelData.license || 'Unknown',
    };
    
    if (isMongoAvailable && db.collection) {
      try {
        await db.collection('installed_models').updateOne(
          { _id: completeModelData._id },
          { $set: completeModelData },
          { upsert: true }
        );
      } catch (err) {
        logger.error('MongoDB operation failed:', err);
        // Fallback to JSON if MongoDB operation fails
        if (!db.installed_models) db.installed_models = [];
        const existingIndex = db.installed_models.findIndex(
          (model) => model._id === completeModelData._id
        );
        if (existingIndex >= 0) {
          db.installed_models[existingIndex] = completeModelData;
        } else {
          db.installed_models.push(completeModelData);
        }
        saveJSON();
      }
    } else {
      // Direct JSON storage
      if (!db.installed_models) db.installed_models = [];
      const existingIndex = db.installed_models.findIndex(
        (model) => model._id === completeModelData._id
      );
      if (existingIndex >= 0) {
        db.installed_models[existingIndex] = completeModelData;
      } else {
        db.installed_models.push(completeModelData);
      }
      saveJSON();
    }
    logger.info(`Model ${completeModelData.name} saved to installed_models collection`);
    return true;
  } catch (err) {
    logger.error('Failed to save installed model:', err);
    return false;
  }
}

async function deleteInstalledModel(modelId) {
  try {
    if (isMongoAvailable && db.collection) {
      try {
        await db.collection('installed_models').deleteOne({ _id: modelId });
      } catch (err) {
        logger.error('MongoDB delete operation failed:', err);
        // Fallback to JSON if MongoDB operation fails
        if (!db.installed_models) return true;
        db.installed_models = db.installed_models.filter(
          (model) => model._id !== modelId
        );
        saveJSON();
      }
    } else {
      // Direct JSON storage
      if (!db.installed_models) return true;
      db.installed_models = db.installed_models.filter(
        (model) => model._id !== modelId
      );
      saveJSON();
    }
    logger.info(`Model ${modelId} deleted from installed_models collection`);
    return true;
  } catch (err) {
    logger.error('Failed to delete installed model:', err);
    return false;
  }
}

module.exports = {
  getChats,
  saveChat,
  deleteChat,
  getInstalledModels,
  saveInstalledModel,
  deleteInstalledModel,
  connectToDB,
  isMongoAvailable,
};