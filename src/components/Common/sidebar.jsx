import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChatBubbleLeftIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  Bars3Icon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useElectronApi } from "../../contexts/ElectronApiContext";

function Sidebar() {
  const navigate = useNavigate();
  const { isApiReady } = useElectronApi();
  const [expanded, setExpanded] = useState(false);
  const [showChats, setShowChats] = useState(true);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  ////// Load recent chats from storage on mount
  useEffect(() => {
    const loadChats = async () => {
      if (!isApiReady) return;
      
      try {
        setLoading(true);
        ////// Get all chats for default profile
        const result = await window.electronAPI.storage.chats.getAll('default');
        const chatList = result?.chats || result || [];
        ////// Sort by last updated and take top 10
        const sortedChats = Array.isArray(chatList) 
          ? chatList.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 10)
          : [];
        setChats(sortedChats);
      } catch (err) {
        console.error('Failed to load chats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [isApiReady]);

  ////// Create new chat and navigate to chat page
  const handleNewChat = () => {
    navigate('/chat');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition-all duration-200
     ${isActive ? "bg-[#2a2a2a] text-white" : "text-gray-400"}`;

  return (
    <div
      id="sidebar"
      className={`${
        expanded ? "w-60" : "w-16"
      } flex-shrink-0 bg-[#0c0c0c] flex flex-col py-4 border-r border-[#2a2a2a] transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 mb-6">
        <button
          id="sidebar-toggle"
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
        >
          <Bars3Icon className="w-6 h-6 text-gray-400" />
        </button>
        {expanded && <span className="text-sm font-semibold text-white">Menu</span>}
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col space-y-2 w-full mb-4">
        {/* New Chat Button - Top Level */}
        <button
          id="new-chat-btn-top"
          onClick={handleNewChat}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition-all duration-200 text-blue-400 hover:text-blue-300"
        >
          <PlusIcon className="w-6 h-6 min-w-[24px]" />
          {expanded && <span className="text-sm font-medium">New Chat</span>}
        </button>
      </div>

      {/* Chat Section */}
      <div className="flex flex-col space-y-2 w-full">
        <button
          id="conversations-toggle"
          onClick={() => {
            setShowChats(!showChats);
            // Auto-expand sidebar when clicking on Chat
            if (!expanded) {
              setExpanded(true);
            }
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-[#2a2a2a] transition-all duration-200 w-full"
        >
          <ChatBubbleLeftIcon className="w-6 h-6 min-w-[24px]" />
          {expanded && (
            <>
              <span className="text-sm flex-1 text-left">Chat</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform duration-200 ${
                  showChats ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>

        {/* Chat List */}
        {expanded && showChats && (
          <div
            id="chat-list"
            className="ml-11 mt-2 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar"
          >
            {loading ? (
              <span className="text-xs text-gray-500 italic">Loading...</span>
            ) : chats.length > 0 ? (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.modelId}`, { state: { chatId: chat.id } })}
                  className="block text-gray-400 text-sm hover:text-white truncate w-full text-left"
                >
                  {chat.title || 'Untitled Chat'}
                </button>
              ))
            ) : (
              <span className="text-xs text-gray-500 italic">No conversations yet</span>
            )}
          </div>
        )}

        {/* Models */}
        <NavLink id="models-link" to="/models" className={navLinkClass}>
          <CpuChipIcon className="w-6 h-6 min-w-[24px]" />
          {expanded && <span className="text-sm">Models</span>}
        </NavLink>
      </div>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Bottom Section */}
      <div className="flex flex-col space-y-2 w-full border-t border-[#2a2a2a] pt-4">
        {/* Settings */}
        <NavLink id="settings-link" to="/settings" className={navLinkClass}>
          <Cog6ToothIcon className="w-6 h-6 min-w-[24px]" />
          {expanded && <span className="text-sm">Settings</span>}
        </NavLink>

        {/* Profile */}
        <button
          id="profile-btn"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-[#2a2a2a] transition-colors w-full"
        >
          <UserCircleIcon className="w-7 h-7 min-w-[28px]" />
          {expanded && (
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-white">Guest</span>
              <span className="text-xs text-gray-500">View Profile</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
