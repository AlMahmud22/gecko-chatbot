// API Constants
// Import environment variables if available in browser context
const BASE_URL = typeof process !== 'undefined' && process.env && process.env.BASE_URL 
  ? process.env.BASE_URL 
  : 'https://equators.tech';

const API_BASE_URL = typeof process !== 'undefined' && process.env && process.env.API_BASE_URL 
  ? process.env.API_BASE_URL 
  : `${BASE_URL}/api`;

export const API_ENDPOINTS = {
  HUGGINGFACE: {
    BASE: 'https://huggingface.co/api',
    MODELS: '/models',
    FILES: '/models/:modelId/tree/:revision'
  },
  EQUATORS: {
    BASE: API_BASE_URL,
    AUTH: '/auth',
    OAUTH_CALLBACK: '/auth/callback'
  }
};

export const TIMEOUTS = {
  DEFAULT: 10000,
  LONG: 30000,
  SHORT: 5000
};

export const CACHE_KEYS = {
  HF_MODELS: 'hf-models',
  HF_MODEL_DETAILS: 'hf-model-details',
  LOCAL_MODELS: 'local-models',
  SYSTEM_INFO: 'system-info'
};

export const API_LIMITS = {
  MODELS_PER_PAGE: 20,
  MAX_MODELS_PER_PAGE: 100,
  CACHE_TTL: 1800 // 30 minutes
};
