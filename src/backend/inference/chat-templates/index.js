// Chat templates system - File-based, engine-aware template management
// Exports template loaders for both llama.cpp (GGUF) and transformers (HuggingFace) engines

export { llamaCppTemplateLoader, LlamaCppTemplateLoader } from './llama-cpp-template-loader.js';
export { transformersTemplateLoader, TransformersTemplateLoader } from './transformers-template-loader.js';

// Export centralized template registry
export { templateRegistry, getTemplateForModel } from './template-registry.js';

// Re-export universal template system for backward compatibility
export { universalTemplateSystem, ResponseSanitizer, MODEL_FAMILIES, TEMPLATE_FORMATTERS } from '../universal-template-system.js';
