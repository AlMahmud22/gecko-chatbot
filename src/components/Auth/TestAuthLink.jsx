import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useElectronApi } from '../../contexts/ElectronApiContext';

function TestAuthLink() {
  const { user, isAuthenticated } = useAuth();
  const { openExternalUrl } = useElectronApi();
  const [protocolStatus, setProtocolStatus] = useState(null);
  const [provider, setProvider] = useState('google');
  
  const handleTestLogin = () => {
    // Get the base URL from environment or default to production
    const baseUrl = window.api?.getBaseUrl?.() || 'https://equators.tech';
    
    // Direct link to the test page
    const testPageUrl = `${baseUrl}/test-chatbot-auth`;
    
    // Open the test page in external browser
    openExternalUrl?.(testPageUrl);
  };
  
  const handleTestOAuth = () => {
    // Get the base URL from environment or default to production
    const baseUrl = window.api?.getBaseUrl?.() || 'https://equators.tech';
    
    // Generate the OAuth URL with custom protocol redirect
    const redirectUri = 'equatorschatbot://auth/callback';
    const loginUrl = `${baseUrl}/api/auth/oauth?provider=${provider}&redirect=${encodeURIComponent(redirectUri)}`;
    
    // Open the OAuth login page in external browser
    openExternalUrl?.(loginUrl);
  };
  
  const checkProtocolHandler = async () => {
    try {
      const result = await window.api?.testProtocolHandler?.();
      setProtocolStatus(result);
      console.log('Protocol handler status:', result);
    } catch (error) {
      console.error('Failed to check protocol handler:', error);
      setProtocolStatus({ success: false, error: error.toString() });
    }
  };
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-lg mb-4">
      <h2 className="text-xl font-semibold text-white mb-3">OAuth Deep Linking Test</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-2">
          Status: {isAuthenticated ? (
            <span className="text-green-400 font-medium">Authenticated</span>
          ) : (
            <span className="text-red-400 font-medium">Not authenticated</span>
          )}
        </p>
        
        {isAuthenticated && user && (
          <div className="text-sm text-gray-300">
            <p>Logged in as: {user.name || user.email}</p>
          </div>
        )}
        
        {protocolStatus && (
          <div className="mt-3 p-3 bg-gray-900 rounded-md text-xs font-mono">
            <div className="text-blue-300 mb-1">Protocol Handler Status:</div>
            <pre className="text-gray-300 overflow-x-auto">
              {JSON.stringify(protocolStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 mb-3">
        <button 
          onClick={handleTestLogin}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm transition-colors duration-150"
        >
          Open Test Page
        </button>
        
        <div className="flex items-center space-x-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="px-2 py-2 bg-gray-700 rounded-md text-white text-sm"
          >
            <option value="google">Google</option>
            <option value="github">GitHub</option>
          </select>
          
          <button 
            onClick={handleTestOAuth}
            className={`px-4 py-2 rounded-md text-white text-sm transition-colors duration-150 ${
              provider === 'google' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            Test {provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth
          </button>
        </div>
        
        <button 
          onClick={checkProtocolHandler}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white text-sm transition-colors duration-150"
        >
          Check Protocol Handlers
        </button>
      </div>
    </div>
  );
}

export default TestAuthLink;
