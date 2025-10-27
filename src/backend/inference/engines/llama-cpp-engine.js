//// src/backend/engines/llama-cpp-engine.js
//// Llama.cpp Inference Engine
//// Handles GGUF and GGML model formats
//// Uses node-llama-cpp library

import { BaseInferenceEngine } from './base-engine.js';
import { LlamaChatTemplateRegistry } from '../chat-templates/llama-chat-template-registry.js';
import { ResponseValidator } from '../response-validator.js';
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
      
      //// Filter conversation history to remove any invalid responses
      const validHistory = ResponseValidator.filterConversationHistory(options.conversationHistory || []);
      
      //// Format prompt with appropriate chat template and get stop strings
      const { prompt: formattedPrompt, stopStrings } = this.templateRegistry.formatPrompt(
        prompt,
        templateType,
        validHistory
      );
      
      console.log(`Using template: ${templateType}`);
      console.log(`Conversation history length: ${validHistory.length} messages (${(options.conversationHistory?.length || 0) - validHistory.length} filtered)`);
      console.log(`Stop strings: ${stopStrings.join(', ')}`);
      console.log(`Formatted prompt (first 500 chars):\n${formattedPrompt.substring(0, 500)}...`);

      //// Generate response
      const response = await session.prompt(formattedPrompt, {
        temperature: options.temperature || 0.8,  //// Increased from 0.7 for more variety
        topP: options.topP || 0.9,
        topK: options.topK || 40,
        maxTokens: options.maxTokens || 1000,
        //// Use template-specific stop strings, or user-provided ones
        stopStrings: options.stopStrings || stopStrings,
        //// Add minimum tokens to encourage meaningful responses
        minTokens: 5, //// Encourage at least a few tokens
        //// Add repetition penalty to prevent loops
        repeatPenalty: options.repeatPenalty || 1.1,  //// Penalize repeated tokens
        
        //// Streaming callback (optional)
        onToken: options.onToken ? (chunk) => {
          options.onToken(chunk);
        } : undefined,
      });

      const elapsed = Date.now() - startTime;
      
      console.log(`Raw model response (first 500 chars):\n${response.substring(0, 500)}`);

      //// Clean the response to remove any template artifacts
      const cleanedResponse = this.templateRegistry.cleanResponse(response, templateType);
      
      console.log(`Cleaned response (first 500 chars):\n${cleanedResponse.substring(0, 500)}`);

      //// Validate the response
      const validatedResponse = ResponseValidator.validateAndClean(cleanedResponse);
      
      console.log(`Validated response: ${validatedResponse ? 'VALID' : 'INVALID'}`);
      
      if (!validatedResponse) {
        console.warn('Model generated invalid response after cleaning');
        console.warn('Raw response length:', response.length);
        console.warn('Cleaned response length:', cleanedResponse.length);
        console.warn('Cleaned response:', cleanedResponse);
        
        //// Return a failure message - this won't be added to conversation history
        //// thanks to validation in ChatPage.jsx
        return {
          text: ResponseValidator.getFailureMessage(cleanedResponse),
          tokens: null,
          timings: {
            elapsed_ms: elapsed,
            tokens_per_second: null,
          },
          invalid: true,
        };
      }

      return {
        text: validatedResponse,
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