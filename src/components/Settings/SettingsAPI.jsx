import React, { useState, useEffect } from 'react';
import { useElectronApi } from '../../contexts/ElectronApiContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Spinner from '../Common/Spinner';

function SettingsAPI() {
  const { getSettings, saveSettings } = useElectronApi();
  
  const [huggingFaceToken, setHuggingFaceToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings?.();
        if (settings?.huggingFaceToken) {
          setHuggingFaceToken(settings.huggingFaceToken);
        }
      } catch (err) {
        console.error('Failed to load API settings:', err);
        setError('Failed to load API settings');
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, [getSettings]);

  const handleSaveToken = async () => {
    setSaving(true);
    setSavedMessage('');
    setError(null);
    
    try {
      const settings = await getSettings?.();
      await saveSettings?.({
        ...settings,
        huggingFaceToken
      });
      
      setSavedMessage('API token saved successfully');
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSavedMessage('');
      }, 3000);
    } catch (err) {
      console.error('Failed to save API token:', err);
      setError('Failed to save API token');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner className="w-8 h-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-semibold text-white">API Settings</h2>
      
      <div className="space-y-4 max-w-2xl">
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-2">Hugging Face</h3>
          <p className="text-gray-400 text-sm mb-4">
            Add your Hugging Face API token to access private models and increase rate limits.
            You can create a token in your 
            <a 
              href="https://huggingface.co/settings/tokens" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              Hugging Face account settings
            </a>.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={huggingFaceToken}
                  onChange={(e) => setHuggingFaceToken(e.target.value)}
                  placeholder="hf_..."
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showToken ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                {savedMessage && (
                  <p className="text-green-400 text-sm">{savedMessage}</p>
                )}
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
              </div>
              
              <button
                onClick={handleSaveToken}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
              >
                {saving ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Token"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsAPI;
