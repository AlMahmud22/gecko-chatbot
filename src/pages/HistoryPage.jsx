import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryList from '../components/History/HistoryList';
import { ElectronApiContext } from '../contexts/ElectronApiContext';

function HistoryPage() {
  const { isApiReady } = useContext(ElectronApiContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isApiReady) return;

    const loadHistory = async () => {
      try {
        ////// Use new storage API to get all chats
        const result = await window.electronAPI.storage.chats.getAll('default');
        const chatHistory = result?.chats || result || [];
        setHistory(Array.isArray(chatHistory) ? chatHistory : []);
      } catch (err) {
        console.error('Failed to load history:', err);
        setError('Failed to load chat history.');
      }
    };

    loadHistory();
  }, [isApiReady]);

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