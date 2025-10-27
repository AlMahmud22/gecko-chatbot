//// src/backend/engines/base-engine.js
//// Base Inference Engine Interface
//// All inference engines must implement these methods

export class BaseInferenceEngine {
  constructor(name) {
    this.name = name;
    this.loadedModels = new Map();
  }

  //// Detect chat template from model name
  detectTemplateFromModelName(modelName) {
    const nameLower = modelName.toLowerCase();
    
    //// Llama 2 / Llama 3
    if (nameLower.includes('llama-2') || nameLower.includes('llama2')) {
      return 'llama2';
    }
    if (nameLower.includes('llama-3') || nameLower.includes('llama3')) {
      return 'llama3';
    }
    
    //// Mistral / Mixtral
    if (nameLower.includes('mistral') || nameLower.includes('mixtral')) {
      return 'mistral';
    }
    
    //// ChatML models (OpenHermes, Zephyr, etc.)
    if (nameLower.includes('chatml') || nameLower.includes('openhermes') || 
        nameLower.includes('zephyr') || nameLower.includes('nous')) {
      return 'chatml';
    }
    
    //// Alpaca
    if (nameLower.includes('alpaca')) {
      return 'alpaca';
    }
    
    //// Vicuna
    if (nameLower.includes('vicuna')) {
      return 'vicuna';
    }
    
    //// Phi models
    if (nameLower.includes('phi')) {
      return 'phi';
    }
    
    //// Gemma
    if (nameLower.includes('gemma')) {
      return 'gemma';
    }
    
    //// Command-R
    if (nameLower.includes('command-r') || nameLower.includes('c4ai')) {
      return 'command-r';
    }
    
    //// Default fallback
    return 'chatml'; //// ChatML is a safe default for most models
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