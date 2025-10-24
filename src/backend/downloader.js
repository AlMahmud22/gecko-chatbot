const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

async function downloadModel(modelId, onProgress) {
  const modelUrl = `https://huggingface.co/models/${modelId}/resolve/main/model.gguf`;
  const modelDir = path.join(app.getPath('appData'), 'equators-chatbot', 'models');
  if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir, { recursive: true });
  const modelPath = path.join(modelDir, `${modelId}.gguf`);
  const writer = fs.createWriteStream(modelPath);

  const response = await axios({
    url: modelUrl,
    method: 'GET',
    responseType: 'stream',
  });

  const totalLength = parseInt(response.headers['content-length'], 10);
  let downloaded = 0;

  response.data.on('data', (chunk) => {
    downloaded += chunk.length;
    const progress = (downloaded / totalLength) * 100;
    onProgress({ modelId, value: progress });
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

module.exports = { downloadModel };