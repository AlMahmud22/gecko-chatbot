//// src/backend/inference.js
//// v102 Updated Inference Module using Multi-Engine Router

import { InferenceRouter } from './inference-router.js'
import { getModelsDir } from '../models/models.js'
import path from 'path'
import fs from 'fs'

//// Global router instance
let router = null

//// Active generation abort controllers
const abortControllers = new Map()

//// Get or create router instance
function getRouter() {
  if (!router) {
    router = new InferenceRouter()
  }
  return router
}

//// Load a model for inference
//// modelId → Model filename (e.g., "llama-2-7b-chat.Q4_K_M.gguf")
//// config → optional configuration
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

//// Run inference on a model
//// modelId → which model to use
//// message → user prompt/text
//// config → temperature, top_p, etc
//// generationId → optional ID to track and cancel this generation
export async function runInference(modelId, message, config = {}) {
  const generationId = config.generationId || `${modelId}-${Date.now()}`
  
  try {
    const router = getRouter()

    //// Create abort controller for this generation
    const abortController = new AbortController()
    abortControllers.set(generationId, abortController)

    //// Ensure model is loaded
    const loadedModels = router.getLoadedModels()
    const isLoaded = loadedModels.some(m => m.id === modelId)

    if (!isLoaded) {
      console.log(`Model ${modelId} not loaded, loading now...`)
      const loadResult = await loadModel(modelId, config)
      if (!loadResult.success) {
        throw new Error(`Failed to load model: ${loadResult.error}`)
      }
    }

    //// Build inference options
    const options = {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      topP: config.topP || 0.9,
      topK: config.topK || 40,
      stopStrings: config.stopStrings || undefined,
      //// Pass abort signal
      abortSignal: abortController.signal,
      //// Streaming callback (if supported)
      onToken: config.onToken,
    }

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
