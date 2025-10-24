/**
 * System information utilities with enhanced GPU detection
 */
const si = require('systeminformation');
const { exec } = require('child_process');
const os = require('os');
const logger = require('./logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get comprehensive system information including GPU details with CUDA detection
 * @returns {Promise<Object>} System information object
 */
async function getSystemInfo() {
  try {
    // Get basic system information
    const [system, cpu, mem, graphics] = await Promise.all([
      si.system(),
      si.cpu(),
      si.mem(),
      si.graphics()
    ]);

    // Enhanced GPU information with CUDA detection
    const gpuInfo = await getEnhancedGpuInfo(graphics);

    return {
      platform: process.platform,
      arch: process.arch,
      cpu: {
        model: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
      },
      memory: {
        total: mem.total,
        free: mem.available,
        usedPercent: Math.round((1 - mem.available / mem.total) * 100)
      },
      system: {
        manufacturer: system.manufacturer,
        model: system.model,
      },
      gpu: gpuInfo
    };
  } catch (error) {
    logger.error('Error fetching system info:', error);
    throw error;
  }
}

/**
 * Get enhanced GPU information with CUDA availability check
 * @param {Object} graphics - Graphics information from systeminformation
 * @returns {Promise<Object>} Enhanced GPU information
 */
async function getEnhancedGpuInfo(graphics) {
  const gpuInfo = {
    controllers: graphics.controllers || [],
    displays: graphics.displays || [],
    hasCuda: false,
    hasGpu: false,
    primaryGpu: 'None detected',
    vram: 0
  };

  // Check if we have any GPU
  if (graphics.controllers && graphics.controllers.length > 0) {
    gpuInfo.hasGpu = true;
    
    // Find the first valid GPU (with name and VRAM)
    const primaryGpu = graphics.controllers.find(gpu => 
      gpu.model && (gpu.vram || gpu.memoryTotal)
    ) || graphics.controllers[0];
    
    gpuInfo.primaryGpu = primaryGpu.model || 'Unknown GPU';
    gpuInfo.vram = primaryGpu.vram || primaryGpu.memoryTotal || 0;
    
    // Check for NVIDIA GPU which might support CUDA
    const hasNvidia = graphics.controllers.some(gpu => 
      gpu.vendor && (gpu.vendor.toLowerCase().includes('nvidia') || 
      gpu.model && gpu.model.toLowerCase().includes('nvidia'))
    );
    
    if (hasNvidia) {
      // Try to detect CUDA with nvidia-smi
      try {
        gpuInfo.hasCuda = await checkCudaWithNvidiaSmi();
      } catch (error) {
        logger.warn('Failed to check CUDA with nvidia-smi:', error);
        // Fallback: assume CUDA support if it's NVIDIA
        gpuInfo.hasCuda = true;
      }
    }
  }
  
  return gpuInfo;
}

/**
 * Check CUDA availability using nvidia-smi command
 * @returns {Promise<boolean>} Whether CUDA is available
 */
function checkCudaWithNvidiaSmi() {
  return new Promise((resolve) => {
    // For Windows, the command is the same
    const nvidiaSmiCommand = process.platform === 'win32'
      ? 'nvidia-smi'
      : 'nvidia-smi';
    
    exec(nvidiaSmiCommand, (error, stdout) => {
      if (error) {
        // nvidia-smi failed, CUDA likely not available
        resolve(false);
        return;
      }
      
      // Check output for CUDA version
      const hasCuda = stdout.toLowerCase().includes('cuda');
      resolve(hasCuda);
    });
  });
}

/**
 * Get app paths for data storage
 * @returns {Promise<Object>} Object containing app paths
 */
async function getPaths() {
  const app = require('electron').app;
  
  return {
    appData: app.getPath('appData'),
    userData: app.getPath('userData'),
    temp: app.getPath('temp'),
    downloads: app.getPath('downloads'),
    documents: app.getPath('documents'),
  };
}

/**
 * Get performance recommendations based on system specs
 * @returns {Promise<Array<string>>} List of recommendations
 */
async function getPerformanceRecommendations() {
  try {
    const systemInfo = await getSystemInfo();
    const recommendations = [];
    
    // CPU recommendations
    if (systemInfo.cpu.cores < 4) {
      recommendations.push('Your CPU has limited cores. Consider smaller models.');
    }
    
    // Memory recommendations
    const memGb = systemInfo.memory.total / 1024 / 1024 / 1024;
    if (memGb < 8) {
      recommendations.push('Low system memory detected. Limit concurrent model usage.');
    } else if (memGb < 16) {
      recommendations.push('Consider limiting to smaller models (< 7B parameters).');
    }
    
    // GPU recommendations
    if (!systemInfo.gpu.hasCuda) {
      recommendations.push('No CUDA-capable GPU detected. CPU inference will be used.');
    } else if (systemInfo.gpu.vram < 4 * 1024) {  // Less than 4GB
      recommendations.push('GPU has limited VRAM. Consider using smaller models.');
    }
    
    return recommendations;
  } catch (error) {
    logger.error('Error generating performance recommendations:', error);
    return ['Could not generate performance recommendations.'];
  }
}

module.exports = {
  getSystemInfo,
  getPaths,
  getPerformanceRecommendations
};
