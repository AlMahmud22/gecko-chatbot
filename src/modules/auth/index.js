// Authentication Module - Central Export
export { default as AuthService } from './services/auth-service.js';
export { default as TokenManager } from './services/token-manager.js';
export { default as DeepLinking } from './services/deep-linking.js';

export { default as LoginModal } from './components/login-modal.jsx';
export { default as ProfileModal } from './components/profile-modal.jsx'; 
export { default as ProfileIcon } from './components/profile-icon.jsx';
export { default as PrivacyDisclaimer } from './components/privacy-disclaimer.jsx';

export { AuthProvider, useAuth } from './context/auth-context.jsx';

export * from './types.js';
