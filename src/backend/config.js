// src/backend/config.js
const si = require('systeminformation');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config();

async function getInferenceConfig() {
  try {
    // Try embedded Python first (for production)
    let pythonPath = path.join(__dirname, '../../python/python.exe');
    if (!fs.existsSync(pythonPath)) {
      // Fallback to system Python 3.11
      try {
        pythonPath = process.platform === 'win32'
          ? execSync('where python').toString().split('\n').find(p => p.includes('Python311')) || 'python'
          : execSync('which python3').toString().trim();
      } catch {
        throw new Error('Python 3.11 not found. Please install Python 3.11.');
      }
    }

    // Verify Python exists
    if (!fs.existsSync(pythonPath)) {
      throw new Error('Python 3.11 not found. Please install Python 3.11.');
    }

    // Verify Python version (3.8+)
    const pythonVersion = execSync(`"${pythonPath}" --version`).toString();
    if (!pythonVersion.match(/Python 3\.[8-9]|\d+\./)) {
      throw new Error(`Python 3.8+ is required. Found: ${pythonVersion.trim()}`);
    }

    // Verify llama-cpp-python
    try {
      execSync(`"${pythonPath}" -c "import llama_cpp"`);
    } catch {
      throw new Error('llama-cpp-python is not installed for Python 3.11. Please install it.');
    }

    // System capabilities
    const [cpuInfo, gpuInfo] = await Promise.all([
      si.cpu(),
      si.graphics(),
    ]);

    // GPU detection
    const hasGPU = gpuInfo.controllers.some((controller) =>
      ['nvidia', 'amd', 'intel'].some((vendor) =>
        controller.vendor.toLowerCase().includes(vendor)
      )
    );

    // GPU layers based on VRAM
    let nGpuLayers = 0;
    if (hasGPU) {
      const vram = gpuInfo.controllers[0]?.vram || 0; // VRAM in MB
      nGpuLayers = vram ? Math.min(Math.floor(vram / 100), 50) : 0;
    }

    // Threads
    const nThreads = Math.max(1, Math.min(cpuInfo.cores, 8));

    // Model directory
    const modelDir = process.env.MODEL_DIR || path.join(__dirname, '../../models');

    return {
      pythonPath,
      nGpuLayers,
      nThreads,
      nCtx: parseInt(process.env.LLAMA_CTX_SIZE) || 2048,
      nBatch: parseInt(process.env.LLAMA_BATCH_SIZE) || 512,
      modelDir,
    };
  } catch (err) {
    console.error('Failed to get inference config:', err);
    throw new Error(`Inference setup failed: ${err.message}. Please ensure Python 3.11 and llama-cpp-python are installed.`);
  }
}

module.exports = { getInferenceConfig };