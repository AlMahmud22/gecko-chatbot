//// src/backend/engines/base-engine.js
//// Base Inference Engine Interface
//// All inference engines must implement these methods

import { getTemplateForModel } from '../chat-templates/template-registry.js';

export class BaseInferenceEngine {
  constructor(name) {
    this.name = name;
    this.loadedModels = new Map();
  }

  //// Detect chat template from model name - DEPRECATED
  //// Use getTemplateForModel from template-registry.js instead
  //// Kept for backward compatibility only
  async detectTemplateFromModelName(modelName) {
    console.warn('[BaseEngine] detectTemplateFromModelName is deprecated - use getTemplateForModel from template-registry.js');
    
    // Try to determine engine type (default to llama-cpp for backward compat)
    const engineType = this.name === 'transformers.js' ? 'transformers' : 'llama-cpp';
    const result = await getTemplateForModel(modelName, engineType);
    
    if (result.source === 'registry' && result.template) {
      return result.template.name;
    } else if (result.source === 'universal-system') {
      return result.familyName;
    }
    
    return 'chatml'; // Final fallback
  }

  //// Load a model file
  async loadModel(modelPath, config = {}) {
    throw new Error(`loadModel() not implemented in ${this.name}`);
  }

  //// Generate text from a prompt
  async generate(modelId, prompt, options = {}) {
    throw new Error(`generate() not implemented in ${this.name}`);
  }

  //// Unload model from memory
  async unloadModel(modelId) {
    throw new Error(`unloadModel() not implemented in ${this.name}`);
  }

  //// Check if engine is available (dependencies installed)
  async isAvailable() {
    return true;
  }

  //// Get engine-specific capabilities
  getCapabilities() {
    return {
      streaming: false,
      batching: false,
      gpu: false,
    };
  }
}