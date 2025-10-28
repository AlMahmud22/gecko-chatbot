// Models Core Module

// Re-export all model functions from router
export {
  getAvailableModels,
  scanModels,
  fetchModelDetails,
  getModelDetails,
  deleteModel,
  activateModel,
  deactivateModel,
  getLocalModels,
  installLocalModel,
  getModelsDirectory,
  changeModelsDirectory,
  resetModelsDirectory,
} from './models-router.js';

// Re-export utility functions for use in main.js if needed
export { getModelsDir } from './model-utils.js';