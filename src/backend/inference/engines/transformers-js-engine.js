//// src/backend/engines/transformers-js-engine.js
//// Transformers.js Inference Engine - Unified Template System
//// Handles ONNX, SafeTensors, and PyTorch models
//// Uses centralized template registry with fallback chain

import { BaseInferenceEngine } from './base-engine.js';
import { getTemplateForModel, templateRegistry } from '../chat-templates/template-registry.js';
import { transformersTemplateLoader } from '../chat-templates/transformers-template-loader.js';
import path from 'path';

let pipeline, env;

export class TransformersJsEngine extends BaseInferenceEngine {
  constructor() {
    super('transformers.js');
    this.pipelines = new Map();
    this.modelConfigs = new Map();
    this.templatesLoaded = false;
  }

  //// Initialize transformers.js and load templates (lazy loading)
  async initialize() {
    if (pipeline) return;

    try {
      //// Dynamic import
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      env = transformers.env;

      //// Configure for Node.js (not browser)
      env.allowLocalModels = true;
      env.useBrowserCache = false;
      
      //// Load centralized template registry
      if (!this.templatesLoaded) {
        await templateRegistry.loadAll();
        await transformersTemplateLoader.loadTemplates();
        this.templatesLoaded = true;
      }
      
      console.log('[transformers.js] Engine initialized with centralized registry');
    } catch (err) {
      console.error('[transformers.js] Failed to initialize:', err);
      throw new Error('@xenova/transformers not installed. Run: npm install @xenova/transformers');
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

  //// Load ONNX/PyTorch/SafeTensors model
  //// For local models, expects directory structure from HuggingFace
  async loadModel(modelPath, config = {}) {
    await this.initialize();

    //// For transformers.js, we need the model directory or HF model name
    const modelId = config.modelName || path.basename(modelPath, path.extname(modelPath));
    
    try {
      console.log(`[transformers.js] Loading model: ${modelPath}`);

      //// Determine task type (can be auto-detected or specified)
      const task = config.task || 'text-generation';

      //// Create pipeline
      const pipe = await pipeline(task, modelPath, {
        //// Use local model files
        local_files_only: true,
        
        //// Quantization
        quantized: config.quantized !== false,
        
        //// Device
        device: config.device || 'cpu', //// 'cpu', 'gpu', or 'auto'
        
        //// Progress callback
        progress_callback: config.progressCallback,
      });

      this.pipelines.set(modelId, {
        pipeline: pipe,
        task: task,
        modelPath: modelPath,
      });

      //// Use centralized registry helper with fallback chain
      const templateResult = await getTemplateForModel(modelId, 'transformers');
      console.log(`[transformers.js] Template source: ${templateResult.source}`);
      
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
      
      this.modelConfigs.set(modelId, {
        family: templateFamily,
        template: template,
        source: templateResult.source
      });

      console.log(`[transformers.js] Model loaded: ${modelId} (task: ${task})`);
      console.log(`[transformers.js] Template: ${templateFamily}`);

      return {
        id: modelId,
        name: modelId,
        path: modelPath,
        task: task,
        template: template.name,
        family: templateFamily,
        loaded: true,
      };
    } catch (err) {
      console.error(`[transformers.js] Failed to load model ${modelId}:`, err);
      
      //// If local loading fails, might be a HuggingFace model name
      if (err.message.includes('local_files_only')) {
        console.warn('[transformers.js] Local model loading failed. This might be a HuggingFace model name.');
        console.warn('[transformers.js] For HuggingFace models, use the model name directly (e.g., "Xenova/gpt2")');
      }
      
      throw err;
    }
  }

  //// Generate text using transformers.js
  async generate(modelId, prompt, options = {}) {
    if (!this.pipelines.has(modelId)) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    const { pipeline: pipe, task } = this.pipelines.get(modelId);
    const modelConfig = this.modelConfigs.get(modelId);
    const startTime = Date.now();

    if (!modelConfig) {
      throw new Error(`No configuration found for model ${modelId}`);
    }

    try {
      //// Filter conversation history to remove any invalid responses
      const validHistory = transformersTemplateLoader.filterConversationHistory(
        options.conversationHistory || []
      );
      
      //// Format prompt with appropriate chat template and get stop strings
      const { prompt: formattedPrompt, stopTokens } = transformersTemplateLoader.formatPrompt(
        [...validHistory, { role: 'user', content: prompt }],
        modelConfig.family
      );
      
      console.log(`[transformers.js] Using template: ${modelConfig.template.name}`);
      console.log(`[transformers.js] History: ${validHistory.length} messages`);
      console.log(`[transformers.js] Stop tokens: ${stopTokens.join(', ')}`);
      console.log(`[transformers.js] Prompt preview:\n${formattedPrompt.substring(0, 500)}...`);

      //// Combine template stop tokens with user-defined stop sequences
      const finalStopTokens = [...stopTokens, ...(options.stopStrings || [])];

      let result;

      //// Different tasks have different APIs
      if (task === 'text-generation') {
        //// Build generation config with all parameters
        const generationConfig = {
          max_new_tokens: options.maxTokens ?? 100,
          temperature: options.temperature ?? 0.7,
          top_k: options.topK ?? 50,
          top_p: options.topP ?? 0.9,
          repetition_penalty: options.repetitionPenalty ?? 1.1,
          do_sample: true,
          //// Note: streaming not yet fully supported in transformers.js v2
        };
        
        console.log(`[transformers.js] Generation parameters:`, generationConfig);
        
        result = await pipe(formattedPrompt, generationConfig);

        //// Extract generated text
        const generatedText = result[0]?.generated_text || result.generated_text || '';
        
        const elapsed = Date.now() - startTime;

        //// Clean the response to remove any template artifacts
        const cleanedResponse = transformersTemplateLoader.cleanResponse(generatedText);

        //// Validate the response
        const isValid = transformersTemplateLoader.isValidResponse(cleanedResponse);
        
        if (!isValid) {
          console.warn('[transformers.js] Model generated invalid response');
          return {
            text: '[Model generated an invalid response. Please try again or use a different model.]',
            tokens: null,
            timings: {
              elapsed_ms: elapsed,
            },
            invalid: true,
          };
        }

        return {
          text: cleanedResponse,
          tokens: null,
          timings: {
            elapsed_ms: elapsed,
          },
        };

      } else if (task === 'text2text-generation') {
        //// For T5, BART, etc.
        result = await pipe(formattedPrompt, {
          max_length: options.maxTokens || 100,
        });

        return {
          text: result[0]?.generated_text || '',
          tokens: null,
          timings: {
            elapsed_ms: Date.now() - startTime,
          },
        };

      } else {
        //// Other tasks (classification, QA, etc.)
        result = await pipe(formattedPrompt);
        
        return {
          text: JSON.stringify(result, null, 2),
          tokens: null,
          timings: {
            elapsed_ms: Date.now() - startTime,
          },
        };
      }

    } catch (err) {
      console.error(`Generation failed for ${modelId}:`, err);
      throw err;
    }
  }

  //// Unload model
  async unloadModel(modelId) {
    try {
      if (this.pipelines.has(modelId)) {
        const { pipeline: pipe } = this.pipelines.get(modelId);
        
        //// Dispose pipeline if method exists
        if (pipe.dispose) {
          await pipe.dispose();
        }
        
        this.pipelines.delete(modelId);
        console.log(`Model ${modelId} unloaded`);
      }
    } catch (err) {
      console.error(`Error unloading model ${modelId}:`, err);
    }
  }

  //// Get capabilities
  getCapabilities() {
    return {
      streaming: false, //// Limited streaming support
      batching: true,
      gpu: false, //// ONNX Runtime can use GPU but complex setup
      fileBasedTemplates: true, // New capability
      templateEngine: 'transformers',
      formats: ['ONNX', 'SafeTensors', 'PyTorch'],
      tasks: [
        'text-generation',
        'text2text-generation',
        'text-classification',
        'token-classification',
        'question-answering',
        'translation',
        'summarization',
        'feature-extraction',
      ],
    };
  }
}