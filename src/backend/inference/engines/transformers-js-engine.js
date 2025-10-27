//// src/backend/engines/transformers-js-engine.js
//// Transformers.js Inference Engine
//// Handles ONNX, SafeTensors, and PyTorch models
//// Uses @xenova/transformers library

import { BaseInferenceEngine } from './base-engine.js';
import { TransformersChatTemplateRegistry } from '../chat-templates/transforemers-chat-template-registry.js';
import path from 'path';

let pipeline, env;

export class TransformersJsEngine extends BaseInferenceEngine {
  constructor() {
    super('transformers.js');
    this.pipelines = new Map();
    this.templateRegistry = new TransformersChatTemplateRegistry();
  }

  //// Initialize transformers.js (lazy loading)
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
      
      console.log('transformers.js engine initialized');
    } catch (err) {
      console.error('Failed to initialize transformers.js:', err);
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
      console.log(`Loading model with transformers.js: ${modelPath}`);

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

      //// Detect and store template type
      const templateType = this.detectTemplateFromModelName(modelId);
      console.log(`Detected template for ${modelId}: ${templateType}`);

      console.log(`  Model loaded: ${modelId} (task: ${task})`);

      return {
        id: modelId,
        name: modelId,
        path: modelPath,
        task: task,
        loaded: true,
      };
    } catch (err) {
      console.error(`Failed to load model ${modelId}:`, err);
      
      //// If local loading fails, might be a HuggingFace model name
      if (err.message.includes('local_files_only')) {
        console.warn('Local model loading failed. This might be a HuggingFace model name.');
        console.warn('For HuggingFace models, use the model name directly (e.g., "Xenova/gpt2")');
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
      console.log(`Formatted prompt preview: ${formattedPrompt.substring(0, 200)}...`);

      let result;

      //// Different tasks have different APIs
      if (task === 'text-generation') {
        result = await pipe(formattedPrompt, {
          max_new_tokens: options.maxTokens || 100,
          temperature: options.temperature || 0.7,
          top_k: options.topK || 50,
          top_p: options.topP || 0.9,
          do_sample: true,
          //// Note: streaming not yet fully supported in transformers.js v2
        });

        //// Extract generated text
        const generatedText = result[0]?.generated_text || result.generated_text || '';
        
        const elapsed = Date.now() - startTime;

        return {
          text: generatedText,
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