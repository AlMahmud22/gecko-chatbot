//// src/backend/engines/llama-cpp-engine.js
//// Llama.cpp Inference Engine
//// Handles GGUF and GGML model formats
//// Uses node-llama-cpp library

import { BaseInferenceEngine } from './base-engine.js';
import { LlamaChatTemplateRegistry } from '../chat-templates/llama-chat-template-registry.js';
import path from 'path';

let getLlama, LlamaChatSession;

export class LlamaCppEngine extends BaseInferenceEngine {
  constructor() {
    super('llama.cpp');
    this.llama = null;
    this.models = new Map();
    this.sessions = new Map();
    this.templateRegistry = new LlamaChatTemplateRegistry();
  }

  //// Initialize llama.cpp (lazy loading)
  async initialize() {
    if (this.llama) return;

    try {
      //// Dynamic import to avoid loading if not needed
      const llamaCpp = await import('node-llama-cpp');
      getLlama = llamaCpp.getLlama;
      LlamaChatSession = llamaCpp.LlamaChatSession;
      
      this.llama = await getLlama();
      console.log('  llama.cpp engine initialized');
    } catch (err) {
      console.error('  Failed to initialize llama.cpp:', err);
      throw new Error('node-llama-cpp not installed. Run: npm install node-llama-cpp');
    }
  }

  //// Check if engine is available
  async isAvailable() {
    try {
      await this.initialize();
      return true;
    } catch {
      return false;
    }
  }

  //// Load GGUF/GGML model
  async loadModel(modelPath, config = {}) {
    await this.initialize();

    const modelId = path.basename(modelPath);

    try {
      console.log(`Loading model: ${modelPath}`);

      //// Load model with llama.cpp
      const model = await this.llama.loadModel({
        modelPath: modelPath,
        //// GPU layers - auto-detect or use config
        gpuLayers: config.gpuLayers || 0, //// 0 = CPU only, >0 = use GPU
      });

      //// Create context
      const context = await model.createContext({
        contextSize: config.contextSize || 2048,
        batchSize: config.batchSize || 512,
        threads: config.threads || undefined, //// undefined = auto
      });

      //// Create chat session
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
      });

      //// Store references
      this.models.set(modelId, { model, context });
      this.sessions.set(modelId, session);

      //// Detect and store template type
      const templateType = this.detectTemplateFromModelName(modelId);
      console.log(`Detected template for ${modelId}: ${templateType}`);

      console.log(`  Model loaded: ${modelId}`);

      return {
        id: modelId,
        name: modelId,
        path: modelPath,
        contextSize: config.contextSize || 2048,
        loaded: true,
      };
    } catch (err) {
      console.error(`Failed to load model ${modelId}:`, err);
      throw err;
    }
  }

  //// Generate text using llama.cpp
  async generate(modelId, prompt, options = {}) {
    if (!this.sessions.has(modelId)) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    const session = this.sessions.get(modelId);
    const startTime = Date.now();

    try {
      //// Detect template type for this model
      const templateType = this.detectTemplateFromModelName(modelId);
      
      //// Format prompt with appropriate chat template
      const formattedPrompt = this.templateRegistry.formatPrompt(
        prompt,
        templateType,
        options.conversationHistory || []
      );
      
      console.log(`Using template: ${templateType}`);
      console.log(`Conversation history length: ${options.conversationHistory?.length || 0} messages`);
      console.log(`Formatted prompt (first 500 chars):\n${formattedPrompt.substring(0, 500)}...`);

      //// Generate response
      const response = await session.prompt(formattedPrompt, {
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.9,
        topK: options.topK || 40,
        maxTokens: options.maxTokens || 1000,
        stopStrings: options.stopStrings || undefined,
        
        //// Streaming callback (optional)
        onToken: options.onToken ? (chunk) => {
          options.onToken(chunk);
        } : undefined,
      });

      const elapsed = Date.now() - startTime;

      return {
        text: response,
        tokens: null, //// token count not directly available
        timings: {
          elapsed_ms: elapsed,
          tokens_per_second: null,
        },
      };
    } catch (err) {
      console.error(`Generation failed for ${modelId}:`, err);
      throw err;
    }
  }

  //// Unload model
  async unloadModel(modelId) {
    try {
      if (this.models.has(modelId)) {
        const { model, context } = this.models.get(modelId);
        
        //// Cleanup
        await context.dispose?.();
        await model.dispose?.();
        
        this.models.delete(modelId);
        this.sessions.delete(modelId);
        
        console.log(`Model ${modelId} unloaded`);
      }
    } catch (err) {
      console.error(`Error unloading model ${modelId}:`, err);
    }
  }

  //// Get capabilities
  getCapabilities() {
    return {
      streaming: true,
      batching: false,
      gpu: true, //// Metal (macOS), CUDA, Vulkan support
      formats: ['GGUF', 'GGML'],
    };
  }
}