import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Initialize log directory
const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFilePath = path.join(logDir, 'app.log');

// Helper function to format timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString();
}

// Helper function to colorize text
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Core logging function
function log(level, colorCode, ...args) {
  const timestamp = getTimestamp();
  const message = args.join(' ');
  
  // Console output with colors
  const consoleMessage = `${colorize(`[${timestamp}]`, 'gray')} ${colorize(`[${level}]`, colorCode)} ${message}`;
  console.log(consoleMessage);
  
  // File output without colors
  const fileMessage = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(logFilePath, fileMessage);
}

// Exported logging functions
function info(...args) {
  log('INFO', 'cyan', ...args);
}

function warn(...args) {
  log('WARN', 'yellow', ...args);
}

function error(...args) {
  log('ERROR', 'red', ...args);
}

function debug(...args) {
  log('DEBUG', 'gray', ...args);
}

function success(...args) {
  log('SUCCESS', 'green', ...args);
}

export const logger = {
  info,
  warn,
  error,
  debug,
  success,
};