/**
 * Universal Model Template System (Ollama-inspired)
 * 
 * This module provides a comprehensive, automatic template detection and
 * formatting system for all GGUF models, inspired by Ollama's Modelfile approach.
 * 
 * Key Features:
 * - Automatic model family detection from metadata and filename
 * - Dynamic template assignment with fallback chains
 * - Comprehensive stop token management
 * - Universal response sanitization
 * - Context reset and artifact removal
 * - Zero-configuration for new models
 * 
 * @module UniversalTemplateSystem
 */

import fs from 'fs';
import path from 'path';

/**
 * Model Family Registry
 * Defines all known model families, their patterns, templates, and configurations
 */
const MODEL_FAMILIES = {
  // Meta / LLaMA Family
  'llama3': {
    patterns: [/llama-?3/i, /llama3/i],
    template: 'llama3',
    stopTokens: ['<|eot_id|>', '<|end_of_text|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },
  'llama2': {
    patterns: [/llama-?2/i, /llama2/i, /codellama/i],
    template: 'llama2',
    stopTokens: ['</s>', '[INST]', '[/INST]'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'llama1': {
    patterns: [/^llama[^23]/i, /llama-1/i],
    template: 'llama2', // Use llama2 format as fallback
    stopTokens: ['</s>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 8
  },

  // Mistral AI Family
  'mistral': {
    patterns: [/mistral/i, /mixtral/i],
    template: 'mistral',
    stopTokens: ['</s>', '[INST]', '[/INST]'],
    roles: { system: 'user', user: 'user', assistant: 'assistant' },
    priority: 10
  },

  // Microsoft Family
  'phi3': {
    patterns: [/phi-?3/i, /phi3/i],
    template: 'phi',
    stopTokens: ['<|end|>', '<|user|>', '<|assistant|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },
  'phi2': {
    patterns: [/phi-?2/i, /phi2/i],
    template: 'phi',
    stopTokens: ['<|end|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'phi': {
    patterns: [/\bphi\b/i, /phi-?1/i],
    template: 'phi',
    stopTokens: ['<|end|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 8
  },
  'orca': {
    patterns: [/orca/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },

  // Google Family
  'gemma2': {
    patterns: [/gemma-?2/i, /gemma2/i],
    template: 'gemma',
    stopTokens: ['<end_of_turn>', '<start_of_turn>'],
    roles: { system: 'user', user: 'user', assistant: 'model' },
    priority: 10
  },
  'gemma': {
    patterns: [/gemma/i],
    template: 'gemma',
    stopTokens: ['<end_of_turn>', '<start_of_turn>'],
    roles: { system: 'user', user: 'user', assistant: 'model' },
    priority: 9
  },

  // Cohere Family
  'command-r': {
    patterns: [/command-?r/i, /c4ai-command/i],
    template: 'command-r',
    stopTokens: ['<|END_OF_TURN_TOKEN|>'],
    roles: { system: 'SYSTEM', user: 'USER', assistant: 'CHATBOT' },
    priority: 10
  },

  // Cognitive Computations / Dolphin Family
  'dolphin': {
    patterns: [/dolphin/i, /tiny-?dolphin/i, /samantha/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },

  // Nous Research Family
  'hermes': {
    patterns: [/hermes/i, /nous-hermes/i, /openhermes/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },
  'nous': {
    patterns: [/nous/i, /capybara/i, /obsidian/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },

  // Alignment Lab / Zephyr
  'zephyr': {
    patterns: [/zephyr/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },

  // OpenChat
  'openchat': {
    patterns: [/openchat/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },

  // Stanford / LMSYS
  'vicuna': {
    patterns: [/vicuna/i],
    template: 'vicuna',
    stopTokens: ['USER:', '\\n\\nUSER:'],
    roles: { system: null, user: 'USER', assistant: 'ASSISTANT' },
    priority: 10
  },
  'alpaca': {
    patterns: [/alpaca/i],
    template: 'alpaca',
    stopTokens: ['###', '\\n\\n###'],
    roles: { system: 'Instruction', user: 'Input', assistant: 'Response' },
    priority: 10
  },

  // Chinese Models
  'qwen': {
    patterns: [/qwen/i, /qwen2/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>', '<|endoftext|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },
  'chatglm': {
    patterns: [/chatglm/i, /glm-/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },
  'baichuan': {
    patterns: [/baichuan/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'internlm': {
    patterns: [/internlm/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'yi': {
    patterns: [/\byi-/i, /yi_/i, /01-ai/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 10
  },

  // Other Families
  'falcon': {
    patterns: [/falcon/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'mpt': {
    patterns: [/mpt-/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'stablelm': {
    patterns: [/stablelm/i, /stablecode/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'deepseek': {
    patterns: [/deepseek/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'wizardlm': {
    patterns: [/wizard-?lm/i, /wizard-?coder/i],
    template: 'vicuna',
    stopTokens: ['USER:', '\\n\\nUSER:'],
    roles: { system: null, user: 'USER', assistant: 'ASSISTANT' },
    priority: 9
  },
  'solar': {
    patterns: [/solar/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },
  'neural-chat': {
    patterns: [/neural-?chat/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 9
  },

  // Generic fallbacks
  'instruct': {
    patterns: [/instruct/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 5
  },
  'chat': {
    patterns: [/chat/i],
    template: 'chatml',
    stopTokens: ['<|im_end|>', '<|im_start|>'],
    roles: { system: 'system', user: 'user', assistant: 'assistant' },
    priority: 4
  }
};

/**
 * Chat Template Implementations
 * Each template knows how to format messages for its specific model family
 */
const TEMPLATE_FORMATTERS = {
  llama3: (messages) => {
    let formatted = '<|begin_of_text|>';
    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'assistant' : msg.role;
      formatted += `<|start_header_id|>${role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
    }
    formatted += '<|start_header_id|>assistant<|end_header_id|>\n\n';
    return formatted;
  },

  llama2: (messages) => {
    let formatted = '<s>';
    let hasSystem = false;
    
    for (const msg of messages) {
      if (msg.role === 'system' && !hasSystem) {
        formatted += `[INST] <<SYS>>\n${msg.content}\n<</SYS>>\n\n`;
        hasSystem = true;
      } else if (msg.role === 'user') {
        if (hasSystem && formatted.endsWith('\n\n')) {
          formatted += `${msg.content} [/INST]`;
          hasSystem = false;
        } else {
          formatted += `[INST] ${msg.content} [/INST]`;
        }
      } else if (msg.role === 'assistant') {
        formatted += ` ${msg.content}</s><s>`;
      }
    }
    return formatted;
  },

  mistral: (messages) => {
    let formatted = '';
    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'system') {
        formatted += `[INST] ${msg.content} [/INST]`;
      } else if (msg.role === 'assistant') {
        formatted += ` ${msg.content}</s>`;
      }
    }
    return formatted;
  },

  chatml: (messages) => {
    let formatted = '';
    for (const msg of messages) {
      formatted += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    }
    formatted += '<|im_start|>assistant\n';
    return formatted;
  },

  phi: (messages) => {
    let formatted = '';
    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user';
      formatted += `<|${role}|>\n${msg.content}<|end|>\n`;
    }
    formatted += '<|assistant|>\n';
    return formatted;
  },

  gemma: (messages) => {
    let formatted = '<bos>';
    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'system') {
        formatted += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
      } else if (msg.role === 'assistant') {
        formatted += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
      }
    }
    formatted += '<start_of_turn>model\n';
    return formatted;
  },

  'command-r': (messages) => {
    let formatted = '<BOS_TOKEN>';
    for (const msg of messages) {
      const roleToken = msg.role === 'system' ? 'SYSTEM' : msg.role === 'user' ? 'USER' : 'CHATBOT';
      formatted += `<|START_OF_TURN_TOKEN|><|${roleToken}_TOKEN|>${msg.content}<|END_OF_TURN_TOKEN|>`;
    }
    formatted += '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>';
    return formatted;
  },

  vicuna: (messages) => {
    let formatted = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        formatted += `${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        formatted += `USER: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        formatted += `ASSISTANT: ${msg.content}\n`;
      }
    }
    formatted += 'ASSISTANT: ';
    return formatted;
  },

  alpaca: (messages) => {
    let instruction = '';
    let input = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        instruction = msg.content;
      } else if (msg.role === 'user') {
        input += (input ? '\n' : '') + msg.content;
      }
    }
    
    let formatted = '';
    if (instruction) formatted += `### Instruction:\n${instruction}\n\n`;
    if (input) formatted += `### Input:\n${input}\n\n`;
    formatted += '### Response:\n';
    return formatted;
  }
};

/**
 * Universal Response Sanitizer
 * Removes all known template artifacts and malformed tags
 */
class ResponseSanitizer {
  static ARTIFACT_PATTERNS = [
    // Standard template tags
    /<\|begin_of_text\|>/gi,
    /<\|end_of_text\|>/gi,
    /<\|eot_id\|>/gi,
    /<\|start_header_id\|>/gi,
    /<\|end_header_id\|>/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /<\|endoftext\|>/gi,
    
    // LLaMA/Mistral tags
    /<s>/gi,
    /<\/s>/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<<SYS>>/gi,
    /<\/SYS>/gi,
    /<\/INST>/gi,  // Malformed
    /<INST>/gi,    // Malformed
    
    // Phi tags
    /<\|system\|>/gi,
    /<\|user\|>/gi,
    /<\|assistant\|>/gi,
    /<\|end\|>/gi,
    
    // Gemma tags
    /<bos>/gi,
    /<eos>/gi,
    /<start_of_turn>/gi,
    /<end_of_turn>/gi,
    
    // Command-R tags
    /<BOS_TOKEN>/gi,
    /<\|START_OF_TURN_TOKEN\|>/gi,
    /<\|END_OF_TURN_TOKEN\|>/gi,
    /<\|USER_TOKEN\|>/gi,
    /<\|CHATBOT_TOKEN\|>/gi,
    /<\|SYSTEM_TOKEN\|>/gi,
    
    // Vicuna/Alpaca tags
    /^USER:\s*/gim,
    /^ASSISTANT:\s*/gim,
    /^###\s*(Instruction|Input|Response):\s*/gim,
    
    // Generic malformed tags (catches model hallucinations like <ASSISTER>, <ASSISTANT>, etc.)
    /<\/?[A-Z]{3,}>/gi,  // Any tag with 3+ uppercase letters
    
    // Common artifacts
    /\[NEVER\]/gi,
    /\[ERROR\]/gi,
    /\[FAILED\]/gi,
  ];

  static sanitize(text, templateType = 'chatml') {
    if (!text) return '';
    
    let cleaned = text;
    
    // Apply all artifact pattern removals
    for (const pattern of this.ARTIFACT_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Remove lines that are only artifacts or whitespace
    const lines = cleaned.split('\n');
    const validLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Skip lines with only special characters or artifacts
      if (/^[\[\]<>\/|#]+$/.test(trimmed)) return false;
      return true;
    });
    
    cleaned = validLines.join('\n');
    
    // Normalize whitespace
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/  +/g, ' ');  // Multiple spaces to single
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');  // Max 2 consecutive newlines
    
    return cleaned;
  }

  static validate(text) {
    if (!text || text.trim().length === 0) return false;
    
    // Check for error message patterns
    const errorPatterns = [
      /^\[Model generated/i,
      /^\[Generation stopped/i,
      /^\[NEVER\]$/i,
      /^\[ERROR\]/i,
      /^\[FAILED\]/i,
    ];
    
    for (const pattern of errorPatterns) {
      if (pattern.test(text.trim())) return false;
    }
    
    // Check for remaining template artifacts (shouldn't exist after sanitization)
    const artifactPatterns = [
      /\[INST\]/,
      /\[\/INST\]/,
      /<\/INST>/i,
      /<\|im_start\|>/,
      /<\|im_end\|>/,
      /<\/[A-Z]{3,}>/,  // Malformed closing tags
    ];
    
    for (const pattern of artifactPatterns) {
      if (pattern.test(text)) {
        console.warn('Response contains template artifacts after sanitization:', text.substring(0, 100));
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Universal Template System
 * Main class that orchestrates model detection, template formatting, and response sanitization
 */
export class UniversalTemplateSystem {
  constructor() {
    this.cache = new Map();  // Cache detected configurations
  }

  /**
   * Detect model family from filename only (simplified version for registry fallback)
   * @param {string} modelName - Model filename
   * @returns {string} Detected family name
   */
  detectModelFamily(modelName) {
    const nameLower = modelName.toLowerCase();
    let detectedFamily = null;
    let highestPriority = -1;
    
    // Filename-based detection
    for (const [familyName, family] of Object.entries(MODEL_FAMILIES)) {
      for (const pattern of family.patterns) {
        if (pattern.test(nameLower)) {
          if (family.priority > highestPriority) {
            detectedFamily = familyName;
            highestPriority = family.priority;
          }
        }
      }
    }
    
    // Return detected family or 'unknown'
    return detectedFamily || 'unknown';
  }

  /**
   * Get template configuration for a detected family
   * @param {string} familyName - Family name from detectModelFamily
   * @returns {Object} Template configuration
   */
  getTemplate(familyName) {
    const family = MODEL_FAMILIES[familyName];
    if (!family) {
      // Return chatml fallback
      return {
        name: 'chatml',
        stopTokens: ['<|im_end|>', '<|im_start|>'],
        roles: { system: 'system', user: 'user', assistant: 'assistant' }
      };
    }
    
    return {
      name: family.template,
      stopTokens: family.stopTokens,
      roles: family.roles,
      formatter: TEMPLATE_FORMATTERS[family.template]
    };
  }

  /**
   * Detect model family and configuration from filename and metadata
   * @param {string} modelPath - Path to the model file
   * @param {string} modelName - Model filename
   * @param {Object} metadata - Optional GGUF metadata
   * @returns {Object} Model configuration
   */
  detectModelConfig(modelPath, modelName, metadata = null) {
    const cacheKey = modelName;
    
    // Return cached config if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const nameLower = modelName.toLowerCase();
    let detectedFamily = null;
    let highestPriority = -1;
    
    // Try metadata-based detection first (if available)
    if (metadata) {
      const metadataFamily = this.detectFromMetadata(metadata);
      if (metadataFamily) {
        detectedFamily = metadataFamily;
        console.log(`[Template] Detected from metadata: ${metadataFamily}`);
      }
    }
    
    // Filename-based detection
    if (!detectedFamily) {
      for (const [familyName, family] of Object.entries(MODEL_FAMILIES)) {
        for (const pattern of family.patterns) {
          if (pattern.test(nameLower)) {
            if (family.priority > highestPriority) {
              detectedFamily = familyName;
              highestPriority = family.priority;
            }
          }
        }
      }
    }
    
    // Fallback to chatml if no match
    if (!detectedFamily) {
      console.warn(`[Template] No family match for "${modelName}", using chatml fallback`);
      detectedFamily = 'chat';
    }
    
    const family = MODEL_FAMILIES[detectedFamily];
    const config = {
      family: detectedFamily,
      template: family.template,
      stopTokens: family.stopTokens,
      roles: family.roles,
      formatter: TEMPLATE_FORMATTERS[family.template]
    };
    
    // Cache the configuration
    this.cache.set(cacheKey, config);
    
    console.log(`[Template] Model: ${modelName} → Family: ${detectedFamily} → Template: ${family.template}`);
    
    return config;
  }

  /**
   * Detect model family from GGUF metadata
   * @param {Object} metadata - GGUF metadata object
   * @returns {string|null} Detected family name
   */
  detectFromMetadata(metadata) {
    // Check various metadata fields
    const modelName = metadata['general.name'] || metadata['model.name'] || '';
    const architecture = metadata['general.architecture'] || metadata['model.architecture'] || '';
    const basename = metadata['general.basename'] || '';
    
    const combined = `${modelName} ${architecture} ${basename}`.toLowerCase();
    
    // Match against family patterns
    for (const [familyName, family] of Object.entries(MODEL_FAMILIES)) {
      for (const pattern of family.patterns) {
        if (pattern.test(combined)) {
          return familyName;
        }
      }
    }
    
    return null;
  }

  /**
   * Format messages into model-specific prompt
   * @param {Array} messages - Array of {role, content} message objects
   * @param {Object} config - Model configuration from detectModelConfig
   * @returns {Object} {prompt, stopTokens}
   */
  formatPrompt(messages, config) {
    // Ensure proper message alternation (no consecutive same-role messages)
    const cleanedMessages = this.cleanMessageHistory(messages);
    
    // Use the template formatter
    const formatter = config.formatter || TEMPLATE_FORMATTERS.chatml;
    const formattedPrompt = formatter(cleanedMessages);
    
    return {
      prompt: formattedPrompt,
      stopTokens: config.stopTokens
    };
  }

  /**
   * Clean message history to ensure proper alternation
   * @param {Array} messages - Message array
   * @returns {Array} Cleaned messages
   */
  cleanMessageHistory(messages) {
    const cleaned = [];
    let lastRole = null;
    
    for (const msg of messages) {
      // Skip consecutive messages with same role (keep last one)
      if (msg.role === lastRole && lastRole === 'user') {
        cleaned.pop();
      }
      
      // Only include valid messages
      if (msg.content && msg.content.trim().length > 0) {
        cleaned.push({
          role: msg.role,
          content: msg.content.trim()
        });
        lastRole = msg.role;
      }
    }
    
    return cleaned;
  }

  /**
   * Process and sanitize model response
   * @param {string} rawResponse - Raw response from model
   * @param {Object} config - Model configuration
   * @returns {Object} {text, valid}
   */
  processResponse(rawResponse, config) {
    // Sanitize the response
    const sanitized = ResponseSanitizer.sanitize(rawResponse, config.template);
    
    // Validate the response
    const valid = ResponseSanitizer.validate(sanitized);
    
    return {
      text: sanitized,
      valid: valid,
      original: rawResponse
    };
  }

  /**
   * Filter conversation history to remove invalid responses
   * @param {Array} messages - Message array
   * @returns {Array} Filtered messages
   */
  filterConversationHistory(messages) {
    return messages.filter(msg => {
      // Always keep user and system messages
      if (msg.role === 'user' || msg.role === 'system') return true;
      
      // Validate assistant messages
      if (msg.role === 'assistant') {
        return ResponseSanitizer.validate(msg.content);
      }
      
      return true;
    });
  }

  /**
   * Get available templates
   * @returns {Array} List of template names
   */
  getAvailableTemplates() {
    return Object.keys(TEMPLATE_FORMATTERS);
  }

  /**
   * Get model families
   * @returns {Array} List of model family names
   */
  getModelFamilies() {
    return Object.keys(MODEL_FAMILIES);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const universalTemplateSystem = new UniversalTemplateSystem();

// Export classes for advanced usage
export { ResponseSanitizer, MODEL_FAMILIES, TEMPLATE_FORMATTERS };
