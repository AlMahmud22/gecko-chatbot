import { NavLink, useLocation } from 'react-router-dom';
import { 
  ChatBubbleLeftIcon,
  ClockIcon,
  CpuChipIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx'; // Install with `npm install clsx` if not already present
import ProfileIcon from '../Auth/ProfileIcon';

function Sidebar() {
  const location = useLocation();
  const isMainPage = location.pathname === '/';

  const navLinkClass = ({ isActive }) =>
    clsx(
      'w-10 h-10 mb-4 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors',
      isActive ? 'bg-[#2a2a2a] text-white' : 'text-gray-400'
    );

  return (
    <div className="w-16 flex-shrink-0 bg-[#0c0c0c] flex flex-col items-center py-4 border-r border-[#2a2a2a]">
      <NavLink to="/chat" className={navLinkClass}>
        <ChatBubbleLeftIcon className="w-6 h-6" />
      </NavLink>
      <NavLink to="/models" className={navLinkClass}>
        <CpuChipIcon className="w-6 h-6" />
      </NavLink>
      <NavLink to="/history" className={navLinkClass}>
        <ClockIcon className="w-6 h-6" />
      </NavLink>
      <div className="flex-grow" />
      <ProfileIcon />
      <NavLink to="/settings" className={navLinkClass}>
        <Cog6ToothIcon className="w-6 h-6" />
      </NavLink>
    </div>
  );
}

export default Sidebar;