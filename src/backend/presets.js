const storage = require('./storage');
const logger = require('./logger');

async function getPresets() {
  try {
    let presets = [];
    if (storage.db.chats) {
      presets = storage.db.presets || [];
    } else {
      presets = await storage.db.collection('presets').find().toArray();
    }
    // Return default preset if none exist
    if (presets.length === 0) {
      presets = [{ id: 'default', system_prompt: 'You are a helpful AI assistant.' }];
      await savePreset(presets[0]);
    }
    return presets;
  } catch (err) {
    logger.error('Failed to get presets:', err);
    return [];
  }
}

async function savePreset(preset) {
  try {
    if (!preset.id || !preset.system_prompt) {
      throw new Error('Preset must have an id and system_prompt');
    }
    if (storage.db.chats) {
      storage.db.presets = storage.db.presets || [];
      storage.db.presets = storage.db.presets.filter((p) => p.id !== preset.id);
      storage.db.presets.push(preset);
      storage.saveJSON();
    } else {
      await storage.db.collection('presets').updateOne(
        { id: preset.id },
        { $set: preset },
        { upsert: true }
      );
    }
  } catch (err) {
    logger.error('Failed to save preset:', err);
  }
}

async function getPreset(presetId) {
  try {
    if (storage.db.chats) {
      return storage.db.presets?.find((p) => p.id === presetId) || null;
    } else {
      return await storage.db.collection('presets').findOne({ id: presetId });
    }
  } catch (err) {
    logger.error('Failed to get preset:', err);
    return null;
  }
}

module.exports = { getPresets, savePreset, getPreset };