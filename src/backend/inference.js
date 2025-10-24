const { spawn } = require('child_process');
const path = require('path');
const { getInferenceConfig } = require('./config');

async function runInference(modelId, message, preset) {
  try {
    const config = await getInferenceConfig();
    const scriptPath = path.join(__dirname, 'inference.py');
    const inputData = JSON.stringify({
      modelId,
      message,
      config: {
        ...config,
        temperature: preset === 'default' ? 0.7 : 0.5,
        top_p: 0.9,
        max_tokens: 512,
        model_dir: config.modelDir,
      },
    });

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(config.pythonPath, [scriptPath, inputData], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process failed (code ${code}): ${errorOutput}`));
          return;
        }
        try {
          const result = JSON.parse(output);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.response);
          }
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${err.message}\nOutput: ${output}\nError: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  } catch (err) {
    throw new Error(`Inference setup failed: ${err.message}`);
  }
}

module.exports = { runInference };