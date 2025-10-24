// Authentication State Slice
import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  // State
  authToken: null,
  huggingFaceToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  // Actions
  setAuthToken: (token) => set({ 
    authToken: token, 
    isAuthenticated: !!token 
  }),
  
  setHuggingFaceToken: (token) => set({ 
    huggingFaceToken: token 
  }),
  
  setUser: (user) => set({ user }),
  
  setLoading: (loading) => set({ 
    isLoading: loading 
  }),
  
  login: async (authData) => {
    set({ 
      authToken: authData.token, 
      huggingFaceToken: authData.hfToken,
      user: authData.user,
      isAuthenticated: true,
      isLoading: false
    });
  },
  
  logout: () => set({ 
    authToken: null, 
    huggingFaceToken: null,
    user: null, 
    isAuthenticated: false,
    isLoading: false
  }),
  
  // Getters
  getAuthStatus: () => {
    const state = get();
    return {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      token: state.authToken,
      hfToken: state.huggingFaceToken
    };
  }
}));

export default useAuthStore;
