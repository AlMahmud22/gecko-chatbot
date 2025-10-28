import { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  ChatBubbleLeftIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useElectronApi } from "../../contexts/ElectronApiContext";
import { useProfile } from "../../contexts/ProfileContext";
import ProfileMenu from "../Profile/ProfileMenu";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isApiReady } = useElectronApi();
  const { currentProfile } = useProfile();
  const [expanded, setExpanded] = useState(false);
  const [showChats, setShowChats] = useState(true);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  ////// Memoize loadChats to use as stable reference
  const loadChats = useCallback(async () => {
    if (!isApiReady || !currentProfile) return;
    
    try {
      setLoading(true);
      console.log('[Sidebar] Loading chats for profile:', currentProfile.id);
      
      ////// Get all chats for current profile
      const result = await window.electronAPI.storage.chats.getAll(currentProfile.id);
      const chatList = result?.chats || result || [];
      
      ////// Sort by last updated and take top 10
      const sortedChats = Array.isArray(chatList) 
        ? chatList.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 10)
        : [];
      
      console.log('[Sidebar] Loaded chats:', sortedChats.length);
      setChats(sortedChats);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  }, [isApiReady, currentProfile]);

  ////// Load chats when profile changes or component mounts
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  ////// Listen for profile changes to refresh chats
  useEffect(() => {
    const handleProfileChanged = (event) => {
      console.log('[Sidebar] Profile changed event received:', event.detail);
      // Clear chats immediately, then reload
      setChats([]);
      setActiveChatId(null);
      loadChats();
    };
    
    window.addEventListener('profileChanged', handleProfileChanged);
    
    return () => {
      window.removeEventListener('profileChanged', handleProfileChanged);
    };
  }, [loadChats]);

  ////// Listen for chat updates from ChatPage
  useEffect(() => {
    const handleChatUpdated = (event) => {
      console.log('[Sidebar] Chat updated event received:', event.detail);
      // Immediately reload chats to show new/updated chat
      loadChats();
      // Set the active chat ID when a chat is updated
      if (event.detail?.chatId) {
        setActiveChatId(event.detail.chatId);
      }
    };
    
    const handleRefreshChats = () => {
      console.log('[Sidebar] Manual chat refresh requested');
      loadChats();
    };
    
    window.addEventListener('chatUpdated', handleChatUpdated);
    window.addEventListener('refreshChats', handleRefreshChats);
    
    return () => {
      window.removeEventListener('chatUpdated', handleChatUpdated);
      window.removeEventListener('refreshChats', handleRefreshChats);
    };
  }, [loadChats]);

  ////// Track active chat from URL
  useEffect(() => {
    const chatId = location.state?.chatId;
    if (chatId) {
      setActiveChatId(chatId);
    }
  }, [location.state?.chatId]);

  ////// Create new chat and navigate to chat page
  const handleNewChat = async () => {
    try {
      //// Auto-expand sidebar
      if (!expanded) {
        setExpanded(true);
      }
      //// Clear active chat since we're starting fresh
      setActiveChatId(null);
      //// Navigate to chat page with explicit "newChat" flag to clear any existing chat
      navigate('/chat', { state: { newChat: true } });
    } catch (err) {
      console.error('Failed to navigate to chat:', err);
    }
  };

  ////// Handle chat rename
  const handleRenameChat = useCallback(async (chatId, newTitle) => {
    try {
      await window.electronAPI.storage.chats.update(chatId, { title: newTitle });
      // Refresh chat list
      await loadChats();
      setEditingChatId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  }, [loadChats]);

  ////// Handle chat delete
  const handleDeleteChat = useCallback(async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }
    
    try {
      await window.electronAPI.storage.chats.delete(chatId);
      // Refresh chat list
      await loadChats();
      
      // If deleted chat was active, clear active chat
      if (activeChatId === chatId) {
        setActiveChatId(null);
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }, [loadChats, activeChatId, navigate]);

  ////// Handle starting edit
  const startEditingChat = (chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title || '');
  };

  ////// Handle cancel edit
  const cancelEditingChat = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition-all duration-200
     ${isActive ? "bg-[#2a2a2a] text-white" : "text-gray-400"}`;

  ////// Auto-expand sidebar when clicking on navigation links
  const handleNavClick = () => {
    if (!expanded) {
      setExpanded(true);
    }
  };

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
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition-all duration-200 text-green-500 hover:text-green-400"
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
            className="ml-4 mt-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar"
          >
            {loading ? (
              <span className="text-xs text-gray-500 italic px-3">Loading...</span>
            ) : chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeChatId === chat.id 
                      ? 'bg-[#2a2a2a] text-white' 
                      : 'text-gray-400 hover:bg-[#1a1a1a]'
                  }`}
                >
                  {editingChatId === chat.id ? (
                    // Edit mode
                    <>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenameChat(chat.id, editingTitle);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditingChat();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.target.select()}
                        className="flex-1 bg-[#0c0c0c] text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-green-600"
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameChat(chat.id, editingTitle);
                        }}
                        className="p-1 text-green-400 hover:text-green-300 flex-shrink-0"
                        title="Save"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditingChat();
                        }}
                        className="p-1 text-red-400 hover:text-red-300 flex-shrink-0"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    // Normal mode
                    <>
                      <button
                        onClick={() => {
                          setActiveChatId(chat.id);
                          if (chat.modelId) {
                            navigate(`/chat/${encodeURIComponent(chat.modelId)}`, { state: { chatId: chat.id } });
                          } else {
                            navigate(`/chat`, { state: { chatId: chat.id } });
                          }
                        }}
                        className="flex-1 text-left text-sm truncate"
                        title={chat.title || 'Untitled Chat'}
                      >
                        {chat.title || 'Untitled Chat'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingChat(chat);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-green-500 transition-opacity"
                        title="Rename"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-500 italic px-3">No conversations yet</span>
            )}
          </div>
        )}

        {/* Models */}
        <NavLink 
          id="models-link" 
          to="/models" 
          className={navLinkClass}
          onClick={handleNavClick}
        >
          <CpuChipIcon className="w-6 h-6 min-w-[24px]" />
          {expanded && <span className="text-sm">Models</span>}
        </NavLink>
      </div>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Bottom Section */}
      <div className="flex flex-col space-y-2 w-full border-t border-[#2a2a2a] pt-4">
        {/* Settings */}
        <NavLink 
          id="settings-link" 
          to="/settings" 
          className={navLinkClass}
          onClick={handleNavClick}
        >
          <Cog6ToothIcon className="w-6 h-6 min-w-[24px]" />
          {expanded && <span className="text-sm">Settings</span>}
        </NavLink>

        {/* Profile */}
        <ProfileMenu expanded={expanded} onInteraction={handleNavClick} />
      </div>
    </div>
  );
}

export default Sidebar;
