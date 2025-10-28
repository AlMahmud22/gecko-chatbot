//// src/backend/inference/config-validator.js
//// Inference Configuration Validator
//// Ensures all parameters are within valid ranges with safe defaults

/**
 * Clamps a value between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates and normalizes inference configuration parameters
 * @param {Object} config - Raw configuration object
 * @returns {Object} - Validated and normalized configuration
 */
export function validateInferenceConfig(config = {}) {
  const validated = {};

  //// Sampling parameters
  // Temperature: 0.0 to 2.0 (higher = more creative/random)
  if (typeof config.temperature === 'number') {
    validated.temperature = clamp(config.temperature, 0.0, 2.0);
    if (validated.temperature !== config.temperature) {
      console.warn(`Temperature ${config.temperature} clamped to ${validated.temperature}`);
    }
  } else {
    validated.temperature = 0.7; // Safe default
  }

  // Top-P (nucleus sampling): 0.0 to 1.0
  if (typeof config.topP === 'number') {
    validated.topP = clamp(config.topP, 0.0, 1.0);
    if (validated.topP !== config.topP) {
      console.warn(`Top-P ${config.topP} clamped to ${validated.topP}`);
    }
  } else {
    validated.topP = 0.9; // Safe default
  }

  // Top-K: 1 to 100 (reasonable range)
  if (typeof config.topK === 'number') {
    validated.topK = Math.floor(clamp(config.topK, 1, 100));
    if (validated.topK !== config.topK) {
      console.warn(`Top-K ${config.topK} clamped to ${validated.topK}`);
    }
  } else {
    validated.topK = 40; // Safe default
  }

  // Max tokens: 1 to 8192 (reasonable range for most models)
  if (typeof config.maxTokens === 'number') {
    validated.maxTokens = Math.floor(clamp(config.maxTokens, 1, 8192));
    if (validated.maxTokens !== config.maxTokens) {
      console.warn(`Max tokens ${config.maxTokens} clamped to ${validated.maxTokens}`);
    }
  } else {
    validated.maxTokens = 1000; // Safe default
  }

  // Min tokens: 0 to maxTokens
  if (typeof config.minTokens === 'number') {
    validated.minTokens = Math.floor(clamp(config.minTokens, 0, validated.maxTokens));
  } else {
    validated.minTokens = 5; // Safe default
  }

  //// Penalty parameters
  // Repetition penalty: 1.0 to 2.0 (1.0 = no penalty)
  if (typeof config.repetitionPenalty === 'number') {
    validated.repetitionPenalty = clamp(config.repetitionPenalty, 1.0, 2.0);
    if (validated.repetitionPenalty !== config.repetitionPenalty) {
      console.warn(`Repetition penalty ${config.repetitionPenalty} clamped to ${validated.repetitionPenalty}`);
    }
  } else {
    validated.repetitionPenalty = 1.1; // Safe default
  }

  // Presence penalty: -2.0 to 2.0
  if (typeof config.presencePenalty === 'number') {
    validated.presencePenalty = clamp(config.presencePenalty, -2.0, 2.0);
    if (validated.presencePenalty !== config.presencePenalty) {
      console.warn(`Presence penalty ${config.presencePenalty} clamped to ${validated.presencePenalty}`);
    }
  } else {
    validated.presencePenalty = 0.0; // Safe default
  }

  // Frequency penalty: -2.0 to 2.0
  if (typeof config.frequencyPenalty === 'number') {
    validated.frequencyPenalty = clamp(config.frequencyPenalty, -2.0, 2.0);
    if (validated.frequencyPenalty !== config.frequencyPenalty) {
      console.warn(`Frequency penalty ${config.frequencyPenalty} clamped to ${validated.frequencyPenalty}`);
    }
  } else {
    validated.frequencyPenalty = 0.0; // Safe default
  }

  //// Mirostat parameters
  // Mirostat mode: 0, 1, or 2
  if (typeof config.mirostat === 'number') {
    validated.mirostat = Math.floor(clamp(config.mirostat, 0, 2));
    if (validated.mirostat !== config.mirostat) {
      console.warn(`Mirostat ${config.mirostat} clamped to ${validated.mirostat}`);
    }
  } else {
    validated.mirostat = 0; // Disabled by default
  }

  // Mirostat tau: 0.0 to 10.0
  if (typeof config.mirostatTau === 'number') {
    validated.mirostatTau = clamp(config.mirostatTau, 0.0, 10.0);
  } else {
    validated.mirostatTau = 5.0; // Default
  }

  // Mirostat eta: 0.0 to 1.0
  if (typeof config.mirostatEta === 'number') {
    validated.mirostatEta = clamp(config.mirostatEta, 0.0, 1.0);
  } else {
    validated.mirostatEta = 0.1; // Default
  }

  //// Performance parameters
  // Threads: 1 to 128 (reasonable range)
  if (typeof config.threads === 'number') {
    validated.threads = Math.floor(clamp(config.threads, 1, 128));
    if (validated.threads !== config.threads) {
      console.warn(`Threads ${config.threads} clamped to ${validated.threads}`);
    }
  } else {
    validated.threads = undefined; // Auto-detect
  }

  // Context length: 128 to 32768 (reasonable range)
  if (typeof config.contextLength === 'number') {
    validated.contextLength = Math.floor(clamp(config.contextLength, 128, 32768));
    if (validated.contextLength !== config.contextLength) {
      console.warn(`Context length ${config.contextLength} clamped to ${validated.contextLength}`);
    }
  } else {
    validated.contextLength = 2048; // Safe default
  }

  // Batch size: 1 to 2048 (reasonable range)
  if (typeof config.batchSize === 'number') {
    validated.batchSize = Math.floor(clamp(config.batchSize, 1, 2048));
    if (validated.batchSize !== config.batchSize) {
      console.warn(`Batch size ${config.batchSize} clamped to ${validated.batchSize}`);
    }
  } else {
    validated.batchSize = 512; // Safe default
  }

  // GPU layers: 0 to 100 (reasonable range)
  if (typeof config.gpuLayers === 'number') {
    validated.gpuLayers = Math.floor(clamp(config.gpuLayers, 0, 100));
    if (validated.gpuLayers !== config.gpuLayers) {
      console.warn(`GPU layers ${config.gpuLayers} clamped to ${validated.gpuLayers}`);
    }
  } else {
    validated.gpuLayers = 0; // CPU only by default
  }

  //// Text parameters
  // System prompt: string or empty
  validated.systemPrompt = typeof config.systemPrompt === 'string' ? config.systemPrompt : '';

  // Stop sequences: array of strings
  if (Array.isArray(config.stopSequences)) {
    validated.stopSequences = config.stopSequences.filter(s => typeof s === 'string');
  } else {
    validated.stopSequences = [];
  }

  // Streaming enabled: boolean
  validated.streamingEnabled = typeof config.streamingEnabled === 'boolean' ? config.streamingEnabled : true;

  //// Pass through other parameters unchanged
  if (config.conversationHistory) {
    validated.conversationHistory = config.conversationHistory;
  }
  if (config.generationId) {
    validated.generationId = config.generationId;
  }
  if (config.onToken) {
    validated.onToken = config.onToken;
  }
  if (config.abortSignal) {
    validated.abortSignal = config.abortSignal;
  }

  return validated;
}

/**
 * Validates individual parameter and returns safe value
 * @param {string} name - Parameter name
 * @param {*} value - Parameter value
 * @param {*} defaultValue - Default value if validation fails
 * @returns {*} - Validated value or default
 */
export function validateParameter(name, value, defaultValue) {
  const testConfig = { [name]: value };
  const validated = validateInferenceConfig(testConfig);
  return validated[name] ?? defaultValue;
}

/**
 * Get parameter constraints for UI display
 * @returns {Object} - Parameter constraints
 */
export function getParameterConstraints() {
  return {
    temperature: { min: 0.0, max: 2.0, default: 0.7, step: 0.1 },
    topP: { min: 0.0, max: 1.0, default: 0.9, step: 0.05 },
    topK: { min: 1, max: 100, default: 40, step: 1 },
    maxTokens: { min: 1, max: 8192, default: 1000, step: 1 },
    minTokens: { min: 0, max: 8192, default: 5, step: 1 },
    repetitionPenalty: { min: 1.0, max: 2.0, default: 1.1, step: 0.1 },
    presencePenalty: { min: -2.0, max: 2.0, default: 0.0, step: 0.1 },
    frequencyPenalty: { min: -2.0, max: 2.0, default: 0.0, step: 0.1 },
    mirostat: { min: 0, max: 2, default: 0, step: 1 },
    mirostatTau: { min: 0.0, max: 10.0, default: 5.0, step: 0.1 },
    mirostatEta: { min: 0.0, max: 1.0, default: 0.1, step: 0.01 },
    threads: { min: 1, max: 128, default: undefined, step: 1 },
    contextLength: { min: 128, max: 32768, default: 2048, step: 128 },
    batchSize: { min: 1, max: 2048, default: 512, step: 1 },
    gpuLayers: { min: 0, max: 100, default: 0, step: 1 },
  };
}
