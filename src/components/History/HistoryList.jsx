import { TrashIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

////// Simplified HistoryList component that receives history as props from parent
function HistoryList({ history, onSelect, onDelete }) {
  return (
    <div className="flex flex-col space-y-2">
      {(!history || history.length === 0) ? (
        <div className="text-gray-400">No chat history available.</div>
      ) : (
        history.map((chat) => (
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
                if (window.confirm('Are you sure you want to delete this chat?')) {
                  onDelete(chat.id);
                }
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
  history: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default HistoryList;