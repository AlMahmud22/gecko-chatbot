//// src/backend/engines/base-engine.js
//// Base Inference Engine Interface
//// All inference engines must implement these methods

export class BaseInferenceEngine {
  constructor(name) {
    this.name = name;
    this.loadedModels = new Map();
  }

  //// Detect chat template from model name
  //// Comprehensive detection for all major model families
  detectTemplateFromModelName(modelName) {
    const nameLower = modelName.toLowerCase();
    
    //// ============================================================================
    //// META / LLAMA FAMILY
    //// ============================================================================
    
    //// Llama 3.x series (latest)
    if (nameLower.includes('llama-3') || nameLower.includes('llama3')) {
      return 'llama3';
    }
    
    //// Llama 2 series
    if (nameLower.includes('llama-2') || nameLower.includes('llama2')) {
      return 'llama2';
    }
    
    //// Code Llama (uses Llama 2 format)
    if (nameLower.includes('codellama') || nameLower.includes('code-llama')) {
      return 'llama2';
    }
    
    //// Llama 1 / Generic Llama (use Llama 2 format as fallback)
    if (nameLower.includes('llama') && !nameLower.includes('llama3') && !nameLower.includes('llama2')) {
      return 'llama2';
    }
    
    //// ============================================================================
    //// MISTRAL AI FAMILY
    //// ============================================================================
    
    //// Mistral 7B and variants
    if (nameLower.includes('mistral')) {
      return 'mistral';
    }
    
    //// Mixtral (Mixture of Experts)
    if (nameLower.includes('mixtral')) {
      return 'mistral';
    }
    
    //// ============================================================================
    //// COGNITIVE COMPUTATIONS / DOLPHIN FAMILY
    //// ============================================================================
    
    //// Dolphin (all variants) - uses ChatML
    if (nameLower.includes('dolphin')) {
      return 'chatml';
    }
    
    //// Samantha (by Cognitive Computations)
    if (nameLower.includes('samantha')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// NOUS RESEARCH FAMILY
    //// ============================================================================
    
    //// Nous Hermes (all versions)
    if (nameLower.includes('hermes')) {
      return 'chatml';
    }
    
    //// Nous Capybara
    if (nameLower.includes('capybara')) {
      return 'chatml';
    }
    
    //// Nous Obsidian
    if (nameLower.includes('obsidian')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// ALIGNMENT LAB AI / ZEPHYR
    //// ============================================================================
    
    //// Zephyr (all versions)
    if (nameLower.includes('zephyr')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// OPENCHAT
    //// ============================================================================
    
    //// OpenChat 3.5 and variants
    if (nameLower.includes('openchat')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// TEKNIUM / OPENHERMES
    //// ============================================================================
    
    //// OpenHermes (uses ChatML)
    if (nameLower.includes('openhermes')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// MICROSOFT PHI FAMILY
    //// ============================================================================
    
    //// Phi-3 series
    if (nameLower.includes('phi-3') || nameLower.includes('phi3')) {
      return 'phi';
    }
    
    //// Phi-2
    if (nameLower.includes('phi-2') || nameLower.includes('phi2')) {
      return 'phi';
    }
    
    //// Phi-1.5 and Phi-1
    if (nameLower.includes('phi')) {
      return 'phi';
    }
    
    //// Orca (Microsoft - uses ChatML)
    if (nameLower.includes('orca')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// GOOGLE FAMILY
    //// ============================================================================
    
    //// Gemma (all versions)
    if (nameLower.includes('gemma')) {
      return 'gemma';
    }
    
    //// Gemma 2
    if (nameLower.includes('gemma-2') || nameLower.includes('gemma2')) {
      return 'gemma';
    }
    
    //// ============================================================================
    //// COHERE FAMILY
    //// ============================================================================
    
    //// Command-R and Command-R+
    if (nameLower.includes('command-r') || nameLower.includes('command_r') || 
        nameLower.includes('c4ai-command')) {
      return 'command-r';
    }
    
    //// ============================================================================
    //// STANFORD / LMSYS FAMILY
    //// ============================================================================
    
    //// Vicuna (all versions)
    if (nameLower.includes('vicuna')) {
      return 'vicuna';
    }
    
    //// Alpaca (Stanford)
    if (nameLower.includes('alpaca')) {
      return 'alpaca';
    }
    
    //// ============================================================================
    //// DATABRICKS FAMILY
    //// ============================================================================
    
    //// DBRX (uses ChatML-like format)
    if (nameLower.includes('dbrx')) {
      return 'chatml';
    }
    
    //// Dolly (uses Alpaca-style)
    if (nameLower.includes('dolly')) {
      return 'alpaca';
    }
    
    //// ============================================================================
    //// ALIBABA FAMILY
    //// ============================================================================
    
    //// Qwen / Qwen2
    if (nameLower.includes('qwen')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// TENCENT FAMILY
    //// ============================================================================
    
    //// Hunyuan
    if (nameLower.includes('hunyuan')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// BAIDU FAMILY
    //// ============================================================================
    
    //// ERNIE
    if (nameLower.includes('ernie')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// STABILITY AI FAMILY
    //// ============================================================================
    
    //// StableLM (uses ChatML)
    if (nameLower.includes('stablelm')) {
      return 'chatml';
    }
    
    //// StableCode
    if (nameLower.includes('stablecode')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// ELEUTHERAI FAMILY
    //// ============================================================================
    
    //// Pythia
    if (nameLower.includes('pythia')) {
      return 'chatml';
    }
    
    //// GPT-NeoX
    if (nameLower.includes('neox') || nameLower.includes('gpt-neox')) {
      return 'chatml';
    }
    
    //// GPT-J
    if (nameLower.includes('gpt-j') || nameLower.includes('gptj')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// BIGSCIENCE FAMILY
    //// ============================================================================
    
    //// BLOOM
    if (nameLower.includes('bloom')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// TIIUAE FAMILY
    //// ============================================================================
    
    //// Falcon (all versions)
    if (nameLower.includes('falcon')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// MOSAICML FAMILY
    //// ============================================================================
    
    //// MPT (MosaicML Pretrained Transformer)
    if (nameLower.includes('mpt')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// XVERSE FAMILY
    //// ============================================================================
    
    //// Xverse
    if (nameLower.includes('xverse')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// 01.AI / YI FAMILY
    //// ============================================================================
    
    //// Yi (all versions)
    if (nameLower.includes('yi-') || nameLower.includes('yi_')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// DEEPSEEK FAMILY
    //// ============================================================================
    
    //// DeepSeek Coder
    if (nameLower.includes('deepseek')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// WIZARDLM FAMILY
    //// ============================================================================
    
    //// WizardLM
    if (nameLower.includes('wizardlm') || nameLower.includes('wizard-lm')) {
      return 'vicuna';
    }
    
    //// WizardCoder
    if (nameLower.includes('wizardcoder') || nameLower.includes('wizard-coder')) {
      return 'vicuna';
    }
    
    //// ============================================================================
    //// INTEL FAMILY
    //// ============================================================================
    
    //// Neural Chat
    if (nameLower.includes('neural-chat') || nameLower.includes('neuralchat')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// UPSTAGE FAMILY
    //// ============================================================================
    
    //// Solar
    if (nameLower.includes('solar')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// ANTHROPIC-STYLE MODELS
    //// ============================================================================
    
    //// Claude-style models (if any quantized versions exist)
    if (nameLower.includes('claude')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// OPENAI-STYLE MODELS
    //// ============================================================================
    
    //// GPT-style models (community versions)
    if (nameLower.includes('gpt-') || nameLower.includes('gpt2') || nameLower.includes('gpt3')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// JAPANESE MODELS
    //// ============================================================================
    
    //// Rinna (Japanese)
    if (nameLower.includes('rinna')) {
      return 'chatml';
    }
    
    //// Japanese StableLM
    if (nameLower.includes('japanese')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// CHINESE MODELS
    //// ============================================================================
    
    //// ChatGLM
    if (nameLower.includes('chatglm') || nameLower.includes('glm')) {
      return 'chatml';
    }
    
    //// Baichuan
    if (nameLower.includes('baichuan')) {
      return 'chatml';
    }
    
    //// InternLM
    if (nameLower.includes('internlm')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// MULTILINGUAL MODELS
    //// ============================================================================
    
    //// XGLM (multilingual)
    if (nameLower.includes('xglm')) {
      return 'chatml';
    }
    
    //// mGPT (multilingual GPT)
    if (nameLower.includes('mgpt')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// SPECIALIZED / DOMAIN-SPECIFIC MODELS
    //// ============================================================================
    
    //// Medical models (BioGPT, MedAlpaca, etc.)
    if (nameLower.includes('med') || nameLower.includes('bio')) {
      return 'chatml';
    }
    
    //// Code-specific models (general)
    if (nameLower.includes('code') && !nameLower.includes('codellama')) {
      return 'chatml';
    }
    
    //// Math models (MAmmoTH, etc.)
    if (nameLower.includes('math') || nameLower.includes('mammoth')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// GENERIC FORMAT INDICATORS
    //// ============================================================================
    
    //// Explicitly named ChatML models
    if (nameLower.includes('chatml')) {
      return 'chatml';
    }
    
    //// Instruct models (default to ChatML)
    if (nameLower.includes('instruct')) {
      return 'chatml';
    }
    
    //// Chat models (default to ChatML)
    if (nameLower.includes('chat') && !nameLower.includes('openchat')) {
      return 'chatml';
    }
    
    //// ============================================================================
    //// DEFAULT FALLBACK
    //// ============================================================================
    
    //// ChatML is the most widely compatible format
    return 'chatml';
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