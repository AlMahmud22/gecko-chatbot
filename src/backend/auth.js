// Authentication helper functions
const { app, shell } = require('electron');
const Store = require('electron-store');
const path = require('path');
const { authService } = require('./auth-service');

const store = new Store();
const AUTH_TOKEN_KEY = 'authToken';
const HF_TOKEN_KEY = 'huggingFaceToken';
const PROTOCOL = 'equatorschatbot';
const ALT_PROTOCOL = 'myapp';

function setupDeepLinking(win) {
  // Register protocol handlers
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      // Register both protocols
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1])
      ]);
      app.setAsDefaultProtocolClient(ALT_PROTOCOL, process.execPath, [
        path.resolve(process.argv[1])
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
    app.setAsDefaultProtocolClient(ALT_PROTOCOL);
  }

  // Handle deep link on Windows
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance, focus our window instead
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      
      // Handle the deep link URL if it exists
      handleDeepLink(commandLine.pop(), win);
    }
  });

  // Handle deep link on macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url, win);
  });
}

function handleDeepLink(url, win) {
  if (!url) return;
  
  console.log('Handling deep link:', url);
  
  // Check if the URL is the expected format (equatorschatbot://auth/callback?token=xyz or myapp://callback?token=xyz)
  const isAuthUrl = url.startsWith(`${PROTOCOL}://auth/callback`) || url.startsWith(`${ALT_PROTOCOL}://callback`);
  if (!isAuthUrl) return;
  
  // Extract token from URL
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    
    if (token) {
      console.log('Received authentication token via deep link');
      
      // Process auth callback using enhanced service
      authService.processAuthCallback(token).then(result => {
        console.log('Auth callback result:', result);
        if (result.success) {
          console.log('Auth callback successful, sending events to renderer');
          // Send the token and user info to the renderer process via both events
          // for compatibility with different listeners
          win.webContents.send('auth-callback', {
            token: result.token,
            hfToken: result.hfToken,
            user: result.user
          });
          
          // Also send the token directly for the onAuthToken listener
          win.webContents.send('auth-token-received', result.token);
          
          // Show the window and focus it
          if (win.isMinimized()) win.restore();
          win.focus();
        } else {
          console.error('Auth callback processing failed:', result.error);
          win.webContents.send('auth-error', result.error);
        }
      }).catch(err => {
        console.error('Auth callback processing error:', err);
        win.webContents.send('auth-error', 'Failed to process authentication');
      });
    }
  } catch (err) {
    console.error('Failed to handle deep link:', err);
    win.webContents.send('auth-error', 'Failed to process authentication');
  }
}

function getAuthToken() {
  return store.get(AUTH_TOKEN_KEY);
}

function getHuggingFaceToken() {
  return store.get(HF_TOKEN_KEY);
}

function saveAuthToken(token) {
  store.set(AUTH_TOKEN_KEY, token);
  
  // Also extract and save HF token if present
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.hf_token) {
      store.set(HF_TOKEN_KEY, payload.hf_token);
    }
  } catch (err) {
    console.error('Failed to extract HF token from JWT:', err);
  }
}

function saveHuggingFaceToken(hfToken) {
  store.set(HF_TOKEN_KEY, hfToken);
}

function clearAuthToken() {
  store.delete(AUTH_TOKEN_KEY);
  store.delete(HF_TOKEN_KEY);
}

module.exports = {
  setupDeepLinking,
  handleDeepLink,
  getAuthToken,
  getHuggingFaceToken,
  saveAuthToken,
  saveHuggingFaceToken,
  clearAuthToken
};
