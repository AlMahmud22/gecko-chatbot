// Inference Module - Multi-Engine Router

import { InferenceRouter } from './inference-router.js'
import { getModelsDir } from '../models/models.js'
import { validateInferenceConfig } from './config-validator.js'
import path from 'path'
import fs from 'fs'

// Global router instance
let router = null

// Active generation abort controllers
const abortControllers = new Map()

// Get or create router instance
function getRouter() {
  if (!router) {
    router = new InferenceRouter()
  }
  return router
}

// Load a model for inference
export async function loadModel(modelId, config = {}) {
  try {
    const modelDir = getModelsDir()
    const modelPath = path.join(modelDir, modelId)

    //// Check if model exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`)
    }

    const router = getRouter()
    const modelInfo = await router.loadModel(modelPath, config)

    return {
      success: true,
      modelInfo,
    }
  } catch (err) {
    console.error('Failed to load model:', err)
    return {
      success: false,
      error: err.message,
    }
  }
}

// Run inference on a model
export async function runInference(modelId, message, config = {}) {
  const generationId = config.generationId || `${modelId}-${Date.now()}`
  
  try {
    const router = getRouter()

    //// Validate and normalize configuration
    const validatedConfig = validateInferenceConfig(config)
    console.log('[inference] Configuration validated')

    //// Create abort controller for this generation
    const abortController = new AbortController()
    abortControllers.set(generationId, abortController)

    //// Ensure model is loaded
    const loadedModels = router.getLoadedModels()
    const isLoaded = loadedModels.some(m => m.id === modelId)

    if (!isLoaded) {
      console.log(`Model ${modelId} not loaded, loading now...`)
      const loadConfig = {
        gpuLayers: validatedConfig.gpuLayers ?? 0,
        contextSize: validatedConfig.contextLength ?? 2048,
        batchSize: validatedConfig.batchSize ?? 512,
        threads: validatedConfig.threads,
      }
      const loadResult = await loadModel(modelId, loadConfig)
      if (!loadResult.success) {
        throw new Error(`Failed to load model: ${loadResult.error}`)
      }
    }

    //// Process conversation history - add system prompt if provided
    let conversationHistory = validatedConfig.conversationHistory || []
    
    //// Prepend system prompt as first system message if configured
    if (validatedConfig.systemPrompt && validatedConfig.systemPrompt.trim().length > 0) {
      //// Check if there's already a system message at the start
      const hasSystemMessage = conversationHistory.length > 0 && conversationHistory[0].role === 'system'
      
      if (!hasSystemMessage) {
        //// Add system prompt at the beginning
        conversationHistory = [
          { role: 'system', content: validatedConfig.systemPrompt },
          ...conversationHistory
        ]
        console.log('[inference] System prompt added to conversation')
      } else {
        //// Replace existing system message with configured one
        conversationHistory[0] = { role: 'system', content: validatedConfig.systemPrompt }
        console.log('[inference] System prompt replaced existing system message')
      }
    }

    //// Build inference options with validated parameters
    const options = {
      //// Sampling parameters
      temperature: validatedConfig.temperature,
      topP: validatedConfig.topP,
      topK: validatedConfig.topK,
      maxTokens: validatedConfig.maxTokens,
      minTokens: validatedConfig.minTokens,
      
      //// Penalty parameters
      repetitionPenalty: validatedConfig.repetitionPenalty,
      repeatPenalty: validatedConfig.repetitionPenalty, // Alias for compatibility
      presencePenalty: validatedConfig.presencePenalty,
      frequencyPenalty: validatedConfig.frequencyPenalty,
      
      //// Mirostat sampling
      mirostat: validatedConfig.mirostat,
      mirostatTau: validatedConfig.mirostatTau,
      mirostatEta: validatedConfig.mirostatEta,
      
      //// Stop sequences
      stopStrings: validatedConfig.stopSequences,
      
      //// Performance parameters
      threads: validatedConfig.threads,
      contextSize: validatedConfig.contextLength,
      batchSize: validatedConfig.batchSize,
      
      //// Pass conversation history for context
      conversationHistory: conversationHistory,
      
      //// Pass abort signal
      abortSignal: abortController.signal,
      
      //// Streaming callback (if supported)
      onToken: validatedConfig.onToken,
    }

    console.log('[inference] Running with config:', {
      modelId,
      temperature: options.temperature,
      topP: options.topP,
      topK: options.topK,
      maxTokens: options.maxTokens,
      repetitionPenalty: options.repetitionPenalty,
      mirostat: options.mirostat,
      threads: options.threads,
      contextSize: options.contextSize,
      hasSystemPrompt: !!validatedConfig.systemPrompt,
      stopSequences: options.stopStrings.length,
      historyLength: conversationHistory.length,
    })

    const response = await router.runInference(modelId, message, options)

    //// Clean up abort controller
    abortControllers.delete(generationId)

    if (!response.success) {
      throw new Error(response.error)
    }

    return {
      success: true,
      response: response.text,
      engine: response.engine,
      timings: response.timings,
      tokens: response.tokens,
      generationId,
    }
  } catch (err) {
    //// Clean up abort controller on error
    abortControllers.delete(generationId)
    
    //// Check if generation was aborted
    if (err.name === 'AbortError' || err.message.includes('aborted')) {
      console.log(`Generation ${generationId} was stopped by user`)
      return {
        success: true,
        response: '[Generation stopped by user]',
        stopped: true,
        generationId,
      }
    }
    
    console.error('Inference error:', err)
    return {
      success: false,
      error: err.message,
    }
  }
}

//// Stop an active generation
export function stopGeneration(generationId) {
  const controller = abortControllers.get(generationId)
  if (controller) {
    console.log(`Stopping generation: ${generationId}`)
    controller.abort()
    abortControllers.delete(generationId)
    return { success: true }
  }
  return { success: false, error: 'Generation not found or already completed' }
}

//// Unload a model from memory
export async function unloadModel(modelId) {
  try {
    const router = getRouter()
    await router.unloadModel(modelId)
    return { success: true }
  } catch (err) {
    console.error('Failed to unload model:', err)
    return { success: false, error: err.message }
  }
}

//// Get list of currently loaded models
export function getLoadedModels() {
  const router = getRouter()
  return router.getLoadedModels()
}

//// Get available inference engines and their status
export async function getEngineStatus() {
  const router = getRouter()
  const engines = []

  for (const [type, engine] of Object.entries(router.engines)) {
    const isAvailable = await engine.isAvailable()
    const capabilities = engine.getCapabilities()

    engines.push({
      type,
      name: engine.name,
      available: isAvailable,
      capabilities,
    })
  }

  return engines
}

//// Clear all loaded models (cleanup)
export async function clearAllModels() {
  try {
    const router = getRouter()
    const loaded = router.getLoadedModels()

    for (const model of loaded) {
      await router.unloadModel(model.id)
    }

    return { success: true, unloaded: loaded.length }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
