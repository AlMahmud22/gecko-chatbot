import { useState, useEffect, useContext } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { ElectronApiContext } from '../../contexts/ElectronApiContext';

import PropTypes from 'prop-types';

function HistoryList({ onSelect }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const { isApiReady } = useContext(ElectronApiContext);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isApiReady || !window.electronAPI?.getChatHistory) {
        setError('Chat history is not available in development mode');
        return;
      }

      try {
        const chats = await window.electronAPI.getChatHistory();
        setHistory(Array.isArray(chats) ? chats : []);
        setError(null);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setError('Failed to load chat history');
        setHistory([]);
      }
    };
    loadHistory();
  }, [isApiReady]);

  const handleDelete = async (chatId) => {
    try {
      await window.electronAPI.deleteChat(chatId);
      setHistory((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {(history || []).length === 0 ? (
        <div className="text-gray-400">No chat history available.</div>
      ) : (
        (history || []).map((chat) => (
          <div
            key={chat.id}
            className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a] cursor-pointer"
            onClick={() => onSelect(chat.id)}
          >
            <span className="text-white">{chat.title || 'Untitled Chat'}</span>
            <button
              className="text-gray-400 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(chat.id);
              }}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

HistoryList.propTypes = {
  onSelect: PropTypes.func.isRequired
};

export default HistoryList;