// Enhanced authentication service for Equators.tech integration
const { shell } = require('electron');
const Store = require('electron-store');
const axios = require('axios');

const store = new Store();
const AUTH_TOKEN_KEY = 'authToken';
const HF_TOKEN_KEY = 'huggingFaceToken';
const USER_PROFILE_KEY = 'userProfile';
const EQUATORS_API_BASE = process.env.API_BASE_URL || 'https://equators.tech/api';

/**
 * Enhanced authentication service that integrates with Equators.tech
 */
class EquatorsAuthService {
  constructor() {
    this.store = store;
  }

  /**
   * Initiate login by opening external browser
   * @param {string} provider - OAuth provider (e.g., 'google', 'github')
   * @param {string} customRedirect - Custom redirect URI (defaults to desktop app protocol)
   */
  async initiateLogin(provider = 'google', customRedirect = 'equatorschatbot://auth/callback') {
    try {
      // 🔧 ENHANCED: Support custom redirect URI and provider selection
      const baseUrl = process.env.BASE_URL || 'https://equators.tech';
      
      // Use direct OAuth endpoint for better deep linking support
      const loginUrl = `${baseUrl}/api/auth/oauth?provider=${provider}&redirect=${encodeURIComponent(customRedirect)}`;
      
      console.log('Opening OAuth login URL:', loginUrl);
      await shell.openExternal(loginUrl);
      
      return { success: true, loginUrl };
    } catch (error) {
      console.error('Failed to open login URL:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process authentication callback with JWT token
   */
  async processAuthCallback(token) {
    try {
      // Parse JWT to extract user info and HF token
      const payload = this.parseJWT(token);
      
      if (!payload) {
        throw new Error('Invalid JWT token format');
      }

      // Store the auth token
      this.store.set(AUTH_TOKEN_KEY, token);

      // Extract and store HF token if present in JWT
      if (payload.hf_token) {
        this.store.set(HF_TOKEN_KEY, payload.hf_token);
      }

      // Store basic user profile from JWT
      const userProfile = {
        id: payload.sub,
        username: payload.username || payload.preferred_username,
        email: payload.email,
        name: payload.name || payload.username,
        avatar: payload.avatar || payload.picture,
        hfUsername: payload.hf_username,
        subscriptionTier: payload.subscription_tier || 'free'
      };

      this.store.set(USER_PROFILE_KEY, userProfile);

      // If HF token not in JWT, try to fetch it from profile API
      if (!payload.hf_token) {
        await this.fetchHuggingFaceToken(token);
      }

      return {
        success: true,
        user: userProfile,
        token,
        hfToken: payload.hf_token || this.store.get(HF_TOKEN_KEY)
      };

    } catch (error) {
      console.error('Failed to process auth callback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch additional user profile data from Equators.tech API
   */
  async fetchUserProfile(token = null) {
    try {
      const authToken = token || this.store.get(AUTH_TOKEN_KEY);
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const response = await axios.get(`${EQUATORS_API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data) {
        // Update stored user profile with additional data
        const existingProfile = this.store.get(USER_PROFILE_KEY) || {};
        const enhancedProfile = {
          ...existingProfile,
          ...response.data,
          lastUpdated: new Date().toISOString()
        };

        this.store.set(USER_PROFILE_KEY, enhancedProfile);
        
        // Store HF token if provided
        if (response.data.hf_token) {
          this.store.set(HF_TOKEN_KEY, response.data.hf_token);
        }

        return { success: true, profile: enhancedProfile };
      }

      return { success: false, error: 'No profile data received' };

    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Don't throw error - profile fetch is optional
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch Hugging Face token from Equators.tech API
   */
  async fetchHuggingFaceToken(authToken = null) {
    try {
      const token = authToken || this.store.get(AUTH_TOKEN_KEY);
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await axios.get(`${EQUATORS_API_BASE}/auth/huggingface-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.hf_token) {
        this.store.set(HF_TOKEN_KEY, response.data.hf_token);
        return { success: true, hfToken: response.data.hf_token };
      }

      return { success: false, error: 'No HF token received' };

    } catch (error) {
      console.error('Failed to fetch HF token:', error);
      // Don't throw error - HF token fetch is optional
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current authentication status
   */
  getAuthStatus() {
    const token = this.store.get(AUTH_TOKEN_KEY);
    const userProfile = this.store.get(USER_PROFILE_KEY);
    const hfToken = this.store.get(HF_TOKEN_KEY);

    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        hfToken: null
      };
    }

    // Check if token is expired
    try {
      const payload = this.parseJWT(token);
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        // Token expired, clear stored data
        this.logout();
        return {
          isAuthenticated: false,
          user: null,
          token: null,
          hfToken: null,
          expired: true
        };
      }
    } catch (error) {
      console.error('Failed to parse stored token:', error);
      this.logout();
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        hfToken: null,
        invalid: true
      };
    }

    return {
      isAuthenticated: true,
      user: userProfile,
      token,
      hfToken,
      hasHfToken: !!hfToken
    };
  }

  /**
   * Logout and clear all stored authentication data
   */
  logout() {
    this.store.delete(AUTH_TOKEN_KEY);
    this.store.delete(HF_TOKEN_KEY);
    this.store.delete(USER_PROFILE_KEY);
    
    console.log('User logged out, all auth data cleared');
    return { success: true };
  }

  /**
   * Get stored tokens
   */
  getTokens() {
    return {
      authToken: this.store.get(AUTH_TOKEN_KEY),
      hfToken: this.store.get(HF_TOKEN_KEY)
    };
  }

  /**
   * Get stored user profile
   */
  getUserProfile() {
    return this.store.get(USER_PROFILE_KEY);
  }

  /**
   * Parse JWT token payload
   */
  parseJWT(token) {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Refresh authentication data
   */
  async refreshAuth() {
    const { token } = this.getTokens();
    
    if (!token) {
      return { success: false, error: 'No token to refresh' };
    }

    try {
      // Fetch fresh profile data
      const profileResult = await this.fetchUserProfile(token);
      
      // Try to get fresh HF token
      await this.fetchHuggingFaceToken(token);

      return {
        success: true,
        profile: profileResult.success ? profileResult.profile : null
      };
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const authService = new EquatorsAuthService();

module.exports = {
  authService,
  EquatorsAuthService
};
