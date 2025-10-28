// Logger Utilities

// ANSI color codes for terminal output
export const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
};

// Color text for console output
export function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Get current timestamp in readable format
export function getTimestamp() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0];
  return `${date} ${time}`;
}

// Format log message with timestamp and level
export function formatLogMessage(level, message) {
  const timestamp = getTimestamp();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

// Strip ANSI color codes from text for file output
export function stripColors(text) {
  return text.replace(/\x1b\[\d+m/g, '');
}