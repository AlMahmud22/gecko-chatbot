import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryList from '../components/History/HistoryList';
import { ElectronApiContext } from '../contexts/ElectronApiContext';
import { useProfile } from '../contexts/ProfileContext';

function HistoryPage() {
  const { isApiReady } = useContext(ElectronApiContext);
  const { currentProfile } = useProfile();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  ////// Memoize loadHistory to prevent unnecessary re-creations
  const loadHistory = useCallback(async () => {
    if (!isApiReady || !currentProfile) return;

    try {
      console.log('[HistoryPage] Loading history for profile:', currentProfile.id);
      ////// Use new storage API to get all chats for current profile
      const result = await window.electronAPI.storage.chats.getAll(currentProfile.id);
      const chatHistory = result?.chats || result || [];
      setHistory(Array.isArray(chatHistory) ? chatHistory : []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load chat history.');
    }
  }, [isApiReady, currentProfile]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  ////// Listen for profile changes to refresh history
  useEffect(() => {
    const handleProfileChanged = (event) => {
      console.log('[HistoryPage] Profile changed event received:', event.detail);
      setHistory([]);
      loadHistory();
    };

    window.addEventListener('profileChanged', handleProfileChanged);
    
    return () => {
      window.removeEventListener('profileChanged', handleProfileChanged);
    };
  }, [loadHistory]);

  const handleSelect = (chatId) => {
    const chat = history.find(c => c.id === chatId);
    if (chat && chat.modelId) {
      navigate(`/chat/${chat.modelId}`, { state: { chatId } });
    }
  };
  
  ////// Handle chat deletion and refresh list
  const handleDelete = async (chatId) => {
    try {
      await window.electronAPI.storage.chats.delete(chatId);
      setHistory(prev => prev.filter(chat => chat.id !== chatId));
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError('Failed to delete chat.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a]">
      {error && (
        <div className="p-4 bg-red-900 text-red-200 text-sm">{error}</div>
      )}
      <div className="px-6 py-4 border-b border-[#2a2a2a]">
        <h1 className="text-lg font-semibold text-white">Chat History</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <HistoryList history={history} onSelect={handleSelect} onDelete={handleDelete} />
      </div>
    </div>
  );
}

export default HistoryPage;