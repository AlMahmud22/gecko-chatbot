//// src/backend/inference/engines/llama-cpp-engine.js
//// Llama.cpp Inference Engine - Unified Template System
//// Handles GGUF and GGML model formats
//// Uses centralized template registry with fallback chain

import { BaseInferenceEngine } from './base-engine.js';
import { getTemplateForModel, templateRegistry } from '../chat-templates/template-registry.js';
import { llamaCppTemplateLoader } from '../chat-templates/llama-cpp-template-loader.js';
import path from 'path';
import fs from 'fs';

let getLlama, LlamaChatSession;

export class LlamaCppEngine extends BaseInferenceEngine {
  constructor() {
    super('llama.cpp');
    this.llama = null;
    this.models = new Map();
    this.sessions = new Map();
    this.modelConfigs = new Map();
    this.templatesLoaded = false;
  }

  //// Initialize llama.cpp and load templates (lazy loading)
  async initialize() {
    if (this.llama) return;

    try {
      //// Dynamic import to avoid loading if not needed
      const llamaCpp = await import('node-llama-cpp');
      getLlama = llamaCpp.getLlama;
      LlamaChatSession = llamaCpp.LlamaChatSession;
      
      this.llama = await getLlama();
      
      //// Load centralized template registry
      if (!this.templatesLoaded) {
        await templateRegistry.loadAll();
        await llamaCppTemplateLoader.loadTemplates();
        this.templatesLoaded = true;
      }
      
      console.log('[llama.cpp] Engine initialized with centralized registry');
    } catch (err) {
      console.error('[llama.cpp] Failed to initialize:', err);
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

  //// Extract GGUF metadata (if possible)
  async extractMetadata(modelPath) {
    try {
      // Try to read GGUF metadata
      // This is a simplified version - in production, you'd use a proper GGUF parser
      const stats = fs.statSync(modelPath);
      
      // For now, return basic info
      // In a full implementation, you'd parse the GGUF header
      return {
        fileSize: stats.size,
        fileName: path.basename(modelPath),
        // Note: Full GGUF metadata parsing would go here
        // This would include architecture, parameters, tokenizer info, etc.
      };
    } catch (err) {
      console.warn('[llama.cpp] Could not extract metadata:', err.message);
      return null;
    }
  }

  //// Load GGUF/GGML model
  async loadModel(modelPath, config = {}) {
    await this.initialize();

    const modelId = path.basename(modelPath);

    try {
      console.log(`[llama.cpp] Loading model: ${modelPath}`);

      // Extract metadata for better template detection
      const metadata = await this.extractMetadata(modelPath);

      // Use centralized registry helper with fallback chain
      const templateResult = await getTemplateForModel(modelId, 'llama-cpp');
      console.log(`[llama.cpp] Template source: ${templateResult.source}`);
      
      let template;
      let templateFamily;
      
      if (templateResult.source === 'registry') {
        template = templateResult.template;
        templateFamily = template.name;
      } else if (templateResult.source === 'universal-system') {
        templateFamily = templateResult.familyName;
        template = templateResult.template;
      } else {
        // Fallback to chatml
        template = templateResult.template;
        templateFamily = 'chatml';
      }

      // Store configuration for this model
      this.modelConfigs.set(modelId, {
        family: templateFamily,
        template: template,
        modelPath: modelPath,
        source: templateResult.source
      });

      //// Load model with llama.cpp
      const model = await this.llama.loadModel({
        modelPath: modelPath,
        //// GPU layers - from config or default to CPU only
        gpuLayers: config.gpuLayers ?? 0, //// 0 = CPU only, >0 = use GPU
      });

      //// Create context with performance settings
      const context = await model.createContext({
        contextSize: config.contextSize ?? 2048,
        batchSize: config.batchSize ?? 512,
        threads: config.threads, //// undefined = auto-detect
      });

      //// Create chat session with context reset capability
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
      });

      //// Store references
      this.models.set(modelId, { model, context, config: template });
      this.sessions.set(modelId, session);

      console.log(`[llama.cpp] Model loaded: ${modelId}`);
      console.log(`[llama.cpp] Template: ${template.name}`);
      console.log(`[llama.cpp] Family: ${templateFamily}`);

      return {
        id: modelId,
        name: modelId,
        path: modelPath,
        contextSize: config.contextSize || 2048,
        template: template.name,
        family: templateFamily,
        loaded: true,
      };
    } catch (err) {
      console.error(`[llama.cpp] Failed to load model ${modelId}:`, err);
      throw err;
    }
  }

  //// Generate text using llama.cpp with file-based template system
  async generate(modelId, prompt, options = {}) {
    if (!this.sessions.has(modelId)) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    const session = this.sessions.get(modelId);
    const modelConfig = this.modelConfigs.get(modelId);
    const startTime = Date.now();

    if (!modelConfig) {
      throw new Error(`No configuration found for model ${modelId}`);
    }

    try {
      //// Filter and clean conversation history
      const rawHistory = options.conversationHistory || [];
      const validHistory = llamaCppTemplateLoader.filterConversationHistory(rawHistory);
      
      //// Add current prompt to history
      const messages = [...validHistory, { role: 'user', content: prompt }];
      
      //// Clean message history
      const cleanedMessages = llamaCppTemplateLoader.cleanMessageHistory(messages);
      
      //// Format prompt using file-based template loader
      const { prompt: formattedPrompt, stopTokens } = llamaCppTemplateLoader.formatPrompt(
        cleanedMessages,
        modelConfig.family
      );
      
      //// Log generation details
      console.log(`[llama.cpp] Generating response`);
      console.log(`[llama.cpp] Model: ${modelId}`);
      console.log(`[llama.cpp] Template: ${modelConfig.template.name}`);
      console.log(`[llama.cpp] Family: ${modelConfig.family}`);
      console.log(`[llama.cpp] History: ${validHistory.length} messages (${rawHistory.length - validHistory.length} filtered)`);
      console.log(`[llama.cpp] Stop tokens: ${stopTokens.join(', ')}`);
      console.log(`[llama.cpp] Prompt preview:\n${formattedPrompt.substring(0, 500)}${formattedPrompt.length > 500 ? '...' : ''}`);

      //// Combine template stop tokens with user-defined stop sequences
      const finalStopTokens = [...stopTokens, ...(options.stopStrings || [])];
      
      //// Generate response with all configured parameters
      const response = await session.prompt(formattedPrompt, {
        //// Sampling parameters
        temperature: options.temperature ?? 0.8,
        topP: options.topP ?? 0.9,
        topK: options.topK ?? 40,
        maxTokens: options.maxTokens ?? 1000,
        minTokens: options.minTokens ?? 5,
        
        //// Penalty parameters (llama.cpp uses repeatPenalty)
        repeatPenalty: options.repeatPenalty ?? options.repetitionPenalty ?? 1.1,
        
        //// Mirostat sampling (0 = disabled, 1 = Mirostat 1.0, 2 = Mirostat 2.0)
        mirostat: options.mirostat ?? 0,
        mirostatTau: options.mirostatTau ?? 5.0,
        mirostatEta: options.mirostatEta ?? 0.1,
        
        //// Stop sequences - use combined list
        stopStrings: finalStopTokens.length > 0 ? finalStopTokens : stopTokens,
        
        //// Streaming callback (optional)
        onToken: options.onToken ? (chunk) => {
          // Stream sanitized chunks
          const sanitized = chunk.replace(/<\/?[A-Z]+>/g, '');
          if (sanitized) options.onToken(sanitized);
        } : undefined,
      });
      
      console.log(`[llama.cpp] Generation parameters applied:`, {
        temperature: options.temperature ?? 0.8,
        topP: options.topP ?? 0.9,
        topK: options.topK ?? 40,
        maxTokens: options.maxTokens ?? 1000,
        repeatPenalty: options.repeatPenalty ?? options.repetitionPenalty ?? 1.1,
        mirostat: options.mirostat ?? 0,
        stopTokensCount: finalStopTokens.length,
      });

      const elapsed = Date.now() - startTime;
      
      console.log(`[llama.cpp] Raw response (${response.length} chars):\n${response.substring(0, 500)}${response.length > 500 ? '...' : ''}`);

      //// Process and sanitize response using template loader
      const processed = llamaCppTemplateLoader.processResponse(response, modelConfig.family);
      
      console.log(`[llama.cpp] Processed response (${processed.text.length} chars):\n${processed.text.substring(0, 500)}${processed.text.length > 500 ? '...' : ''}`);
      console.log(`[llama.cpp] Validation: ${processed.valid ? 'VALID ✓' : 'INVALID ✗'}`);
      
      //// If invalid after processing, return error message
      if (!processed.valid) {
        console.warn('[llama.cpp] Response failed validation after processing');
        console.warn('[llama.cpp] Original length:', response.length);
        console.warn('[llama.cpp] Processed length:', processed.text.length);
        
        return {
          text: this.getFailureMessage(processed.text),
          tokens: null,
          timings: {
            elapsed_ms: elapsed,
            tokens_per_second: null,
          },
          invalid: true,
          original: processed.original
        };
      }

      return {
        text: processed.text,
        tokens: null,
        timings: {
          elapsed_ms: elapsed,
          tokens_per_second: null,
        },
        valid: true
      };
    } catch (err) {
      console.error(`[llama.cpp] Generation failed for ${modelId}:`, err);
      throw err;
    }
  }

  //// Get user-friendly error message
  getFailureMessage(processedText) {
    if (!processedText || processedText.trim().length === 0) {
      return '[Model generated an empty response. Please try again or use a different model.]';
    }
    return '[Model generated an invalid response. Please try again or adjust generation parameters.]';
  }

  //// Reset context for a model (useful for clearing conversation history)
  async resetContext(modelId) {
    if (!this.models.has(modelId)) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    try {
      const { model, context, config } = this.models.get(modelId);
      
      // Dispose old context
      await context.dispose?.();
      
      // Create new context
      const newContext = await model.createContext({
        contextSize: 2048,
        batchSize: 512,
        threads: undefined,
      });
      
      // Create new session
      const newSession = new LlamaChatSession({
        contextSequence: newContext.getSequence(),
      });
      
      // Update stored references
      this.models.set(modelId, { model, context: newContext, config });
      this.sessions.set(modelId, newSession);
      
      console.log(`[llama.cpp] Context reset for ${modelId}`);
      
      return { success: true };
    } catch (err) {
      console.error(`[llama.cpp] Failed to reset context for ${modelId}:`, err);
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
        this.modelConfigs.delete(modelId);
        
        console.log(`[llama.cpp] Model unloaded: ${modelId}`);
      }
    } catch (err) {
      console.error(`[llama.cpp] Error unloading model ${modelId}:`, err);
    }
  }

  //// Get model configuration
  getModelConfig(modelId) {
    return this.modelConfigs.get(modelId) || null;
  }

  //// Get capabilities
  getCapabilities() {
    return {
      streaming: true,
      batching: false,
      gpu: true,
      contextReset: true,
      fileBasedTemplates: true, // New capability
      templateEngine: 'llama-cpp',
      formats: ['GGUF', 'GGML'],
    };
  }
}
