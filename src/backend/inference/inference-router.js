// src/backend/inference-router.js
// Multi-Inference Engine Router
// Automatically detects model type and routes to appropriate inference engine

import path from 'path';
import fs from 'fs';

// Inference engine imports (will be implemented in chunks)
import { LlamaCppEngine } from './engines/llama-cpp-engine.js';
import { TransformersJsEngine } from './engines/transformers-js-engine.js';

// Model file type detection based on extension and magic bytes
export class ModelDetector {
  static EXTENSIONS = {
    GGUF: ['.gguf'],
    GGML: ['.bin', '.ggml'],
    ONNX: ['.onnx'],
    PYTORCH: ['.pt', '.pth', '.bin'],
    SAFETENSORS: ['.safetensors'],
    TENSORFLOW: ['saved_model.pb'],
    RWKV: ['.pth', '.pt'],
  };

  // Detect model type from file path and contents
  static async detectModelType(modelPath) {
    const ext = path.extname(modelPath).toLowerCase();
    const fileName = path.basename(modelPath).toLowerCase();

    // Check file exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }

    // GGUF detection (most common for llama.cpp)
    if (ext === '.gguf') {
      return 'GGUF';
    }

    // GGML detection (older llama.cpp format)
    if (ext === '.ggml' || (ext === '.bin' && this.isGGML(modelPath))) {
      return 'GGML';
    }

    // ONNX detection
    if (ext === '.onnx') {
      return 'ONNX';
    }

    // SafeTensors detection
    if (ext === '.safetensors') {
      return 'SAFETENSORS';
    }

    // PyTorch detection
    if (ext === '.pt' || ext === '.pth') {
      // Check if RWKV model
      if (this.isRWKV(modelPath, fileName)) {
        return 'RWKV';
      }
      return 'PYTORCH';
    }

    // TensorFlow detection
    if (fileName === 'saved_model.pb') {
      return 'TENSORFLOW';
    }

    // .bin files can be GGML, PyTorch, or TensorFlow
    if (ext === '.bin') {
      if (this.isPyTorchBin(modelPath)) {
        return 'PYTORCH';
      }
    }

    throw new Error(`Unsupported model format: ${ext}`);
  }

  // Check if .bin file is GGML format (magic bytes check)
  static isGGML(modelPath) {
    try {
      const fd = fs.openSync(modelPath, 'r');
      const buffer = Buffer.alloc(4);
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);
      
      // GGML magic: "ggml" or "ggjt"
      const magic = buffer.toString('utf8');
      return magic === 'ggml' || magic === 'ggjt';
    } catch (err) {
      console.error('Error checking GGML magic:', err);
      return false;
    }
  }

  // Check if model is RWKV (check filename patterns)
  static isRWKV(modelPath, fileName) {
    return fileName.includes('rwkv');
  }

  // Check if .bin is PyTorch format
  static isPyTorchBin(modelPath) {
    try {
      // PyTorch bins often have "pytorch_model" in name
      const fileName = path.basename(modelPath);
      return fileName.includes('pytorch') || fileName.includes('model');
    } catch (err) {
      return false;
    }
  }
}

// Main Inference Router
// Routes inference requests to appropriate engine
export class InferenceRouter {
  constructor() {
    this.engines = {
      GGUF: new LlamaCppEngine(),
      GGML: new LlamaCppEngine(),
      ONNX: new TransformersJsEngine(),
      SAFETENSORS: new TransformersJsEngine(),
      PYTORCH: new TransformersJsEngine(),
    };
    
    this.loadedModels = new Map(); // Cache loaded models
  }

  // Load a model and prepare it for inference
  async loadModel(modelPath, config = {}) {
    try {
      // Detect model type
      const modelType = await ModelDetector.detectModelType(modelPath);
      console.log(`Detected model type: ${modelType}`);

      // Get appropriate engine
      const engine = this.engines[modelType];
      if (!engine) {
        throw new Error(`No engine available for model type: ${modelType}`);
      }

      // Check if already loaded
      const modelId = path.basename(modelPath);
      if (this.loadedModels.has(modelId)) {
        console.log(`Model ${modelId} already loaded`);
        return this.loadedModels.get(modelId);
      }

      // Load model with engine
      const modelInfo = await engine.loadModel(modelPath, config);
      
      // Cache loaded model
      this.loadedModels.set(modelId, {
        ...modelInfo,
        modelType,
        engine: engine.name,
      });

      return this.loadedModels.get(modelId);
    } catch (err) {
      console.error('Failed to load model:', err);
      throw err;
    }
  }

  // Run inference on a loaded model
  async runInference(modelId, prompt, options = {}) {
    try {
      // Check if model is loaded
      if (!this.loadedModels.has(modelId)) {
        throw new Error(`Model ${modelId} not loaded. Load it first.`);
      }

      const modelInfo = this.loadedModels.get(modelId);
      const engine = this.engines[modelInfo.modelType];

      console.log(`Running inference with ${engine.name} for ${modelId}`);

      // Run inference through appropriate engine
      const response = await engine.generate(modelId, prompt, options);

      return {
        success: true,
        text: response.text,
        tokens: response.tokens || null,
        timings: response.timings || null,
        engine: engine.name,
      };
    } catch (err) {
      console.error('Inference failed:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  // Unload a model from memory
  async unloadModel(modelId) {
    if (!this.loadedModels.has(modelId)) {
      return { success: false, error: 'Model not loaded' };
    }

    const modelInfo = this.loadedModels.get(modelId);
    const engine = this.engines[modelInfo.modelType];

    await engine.unloadModel(modelId);
    this.loadedModels.delete(modelId);

    return { success: true };
  }

  // Get list of loaded models
  getLoadedModels() {
    return Array.from(this.loadedModels.entries()).map(([id, info]) => ({
      id,
      type: info.modelType,
      engine: info.engine,
    }));
  }
}