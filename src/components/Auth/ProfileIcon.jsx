import React, { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import LoginModal from './LoginModal';
import EnhancedProfileModal from './EnhancedProfileModal';

function ProfileIcon() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleClick = () => {
    setIsModalOpen(true);
  };
  
  const handleClose = () => {
    setIsModalOpen(false);
  };
  
  // Common styling for the icon
  const iconClasses = clsx(
    'w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer',
    isAuthenticated ? 'text-blue-400' : 'text-gray-400'
  );
  
  return (
    <>
      <div className={iconClasses} onClick={handleClick} title={isAuthenticated ? "Profile" : "Login"}>
        {isLoading ? (
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
        ) : isAuthenticated && user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.username} 
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <UserCircleIcon className="w-6 h-6" />
        )}
      </div>
      
      {isModalOpen && (
        isAuthenticated ? (
          <EnhancedProfileModal onClose={handleClose} />
        ) : (
          <LoginModal onClose={handleClose} />
        )
      )}
    </>
  );
}

export default ProfileIcon;
