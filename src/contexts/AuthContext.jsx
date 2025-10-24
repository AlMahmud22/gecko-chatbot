import React, { createContext, useContext, useState, useEffect } from 'react';
import { useElectronApi } from './ElectronApiContext';
import useStore from '../store';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const electronApi = useElectronApi();
  const { 
    login: storeLogin, 
    logout: storeLogout, 
    setLoading,
    authToken,
    huggingFaceToken,
    user,
    isAuthenticated,
    isLoading
  } = useStore();
  
  // Initialize auth state from electron-store using enhanced service
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Get auth status from enhanced service
        const authStatus = await electronApi.getAuthStatus?.();
        
        if (authStatus && authStatus.isAuthenticated && authStatus.user) {
          await storeLogin({
            token: authStatus.token,
            hfToken: authStatus.hfToken,
            user: authStatus.user
          });
        } else if (authStatus && (authStatus.expired || authStatus.invalid)) {
          console.log('Token expired or invalid, clearing auth state');
          await storeLogout();
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        // Fallback to old method if enhanced service fails
        try {
          const storedToken = await electronApi.getAuthToken?.();
          const storedHfToken = await electronApi.getHuggingFaceToken?.();
          
          if (storedToken) {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            await storeLogin({
              token: storedToken,
              hfToken: storedHfToken || payload.hf_token,
              user: {
                id: payload.sub,
                username: payload.username,
                email: payload.email,
                avatar: payload.avatar,
                name: payload.name || payload.username
              }
            });
          }
        } catch (fallbackErr) {
          console.error('Fallback auth initialization failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (electronApi.getAuthStatus || electronApi.getAuthToken) {
      initializeAuth();
    }
  }, [electronApi.getAuthStatus, electronApi.getAuthToken, electronApi.getHuggingFaceToken, storeLogin, storeLogout, setLoading]);

  // Listen for auth callbacks from deep linking
  useEffect(() => {
    if (!electronApi.onAuthCallback) return;
    
    const removeAuthCallback = electronApi.onAuthCallback(async (authData) => {
      console.log('Received auth callback:', authData);
      try {
        await login(authData);
      } catch (err) {
        console.error('Failed to process auth callback:', err);
      }
    });

    const removeAuthError = electronApi.onAuthError?.(async (error) => {
      console.error('Auth error:', error);
      // Could show a toast or notification here 
    });
    
    return () => {
      removeAuthCallback();
      removeAuthError?.();
    };
  }, [electronApi.onAuthCallback, electronApi.onAuthError]);

  // Listen for auth token from protocol callback
  useEffect(() => {
    if (!electronApi.onAuthToken) return;
    
    const removeTokenListener = electronApi.onAuthToken(async (token) => {
      console.log('Auth token received via protocol callback');
      try {
        // Parse the JWT token to extract user data and HF token
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        const authData = {
          token: token,
          hfToken: payload.hf_token,
          user: {
            id: payload.sub,
            username: payload.username,
            email: payload.email,
            avatar: payload.avatar,
            name: payload.name || payload.username
          }
        };
        
        // Store in secure storage
        await electronApi.saveAuthToken?.(token);
        if (payload.hf_token) {
          await electronApi.saveHuggingFaceToken?.(payload.hf_token);
        }
        
        // Update store state
        await storeLogin(authData);
        
        console.log('Auth state updated successfully');
      } catch (err) {
        console.error('Failed to process auth token:', err);
      }
    });
    
    return removeTokenListener;
  }, [electronApi.onAuthToken, electronApi.saveAuthToken, electronApi.saveHuggingFaceToken, storeLogin]);
  
  const login = async (authData) => {
    try {
      // Save tokens to electron store
      await electronApi.saveAuthToken?.(authData.token);
      if (authData.hfToken) {
        await electronApi.saveHuggingFaceToken?.(authData.hfToken);
      }
      
      // Update store state
      await storeLogin(authData);
      
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  const startLogin = async () => {
    try {
      // Use enhanced auth service login
      const result = await electronApi.login?.();
      return result?.success || false;
    } catch (err) {
      console.error('Failed to start login:', err);
      return false;
    }
  };
  
  const logout = async () => {
    try {
      // Use enhanced auth service logout
      const result = await electronApi.logout?.();
      if (result?.success) {
        storeLogout();
        return true;
      } else {
        // Fallback to old method
        await electronApi.clearAuthToken?.();
        storeLogout();
        return true;
      }
    } catch (err) {
      console.error('Logout failed:', err);
      return false;
    }
  };
  
  const value = {
    authToken,
    huggingFaceToken,
    user,
    isAuthenticated,
    isLoading,
    login: startLogin,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
