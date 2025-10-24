const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function log(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${level}: ${args.join(' ')}\n`;
  fs.appendFileSync(path.join(logDir, 'app.log'), message);
}

function error(...args) {
  log('ERROR', ...args);
}

function info(...args) {
  log('INFO', ...args);
}

module.exports = { error, info };