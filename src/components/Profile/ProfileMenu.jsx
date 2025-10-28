import { useState, useEffect, useRef } from 'react';
import { 
  UserCircleIcon, 
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useElectronApi } from '../../contexts/ElectronApiContext';
import ProfileModal from './ProfileModal';
import ConfirmDialog from '../Common/ConfirmDialog';

function ProfileMenu({ expanded, onInteraction }) {
  const { isApiReady } = useElectronApi();
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingProfile, setEditingProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Load profiles on mount
  useEffect(() => {
    console.log('ProfileMenu useEffect triggered, isApiReady:', isApiReady);
    if (isApiReady) {
      loadProfiles();
    }
  }, [isApiReady]);

  const loadProfiles = async () => {
    if (!isApiReady || !window.electronAPI) return;
    
    try {
      setLoading(true);
      console.log('Loading profiles...');
      const result = await window.electronAPI.storage.profiles.getAll();
      console.log('GetAll result:', result);
      
      const profileList = result?.profiles || [];
      console.log('Profile list:', profileList);
      
      // Ensure 'default' profile exists
      if (profileList.length === 0) {
        console.log('No profiles found, creating default profile...');
        await createDefaultProfile();
        return;
      }
      
      setProfiles(profileList);
      
      // Load current profile from localStorage or use first profile
      const savedProfileId = localStorage.getItem('currentProfileId');
      console.log('Saved profile ID from localStorage:', savedProfileId);
      
      const current = profileList.find(p => p.id === savedProfileId) || profileList[0];
      console.log('Current profile:', current);
      
      setCurrentProfile(current);
      localStorage.setItem('currentProfileId', current.id);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async () => {
    try {
      const result = await window.electronAPI.storage.profiles.create({
        name: 'Guest',
        description: 'Default profile',
        isDefault: true,
      });
      
      if (result.success && result.profile) {
        setProfiles([result.profile]);
        setCurrentProfile(result.profile);
        localStorage.setItem('currentProfileId', result.profile.id);
      }
    } catch (err) {
      console.error('Failed to create default profile:', err);
    }
  };

  const handleSelectProfile = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentProfileId', profile.id);
    setIsOpen(false);
    // Reload page to apply profile settings
    window.location.reload();
  };

  const handleCreateProfile = () => {
    setModalMode('create');
    setEditingProfile(null);
    setShowModal(true);
    setIsOpen(false);
  };

  const handleEditProfile = (profile, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setEditingProfile(profile);
    setShowModal(true);
  };

  const handleDeleteProfile = (profile, e) => {
    e.stopPropagation();
    setProfileToDelete(profile);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;
    
    try {
      await window.electronAPI.storage.profiles.delete(profileToDelete.id);
      
      // If deleting current profile, switch to another
      if (currentProfile?.id === profileToDelete.id) {
        const remainingProfiles = profiles.filter(p => p.id !== profileToDelete.id);
        if (remainingProfiles.length > 0) {
          handleSelectProfile(remainingProfiles[0]);
        } else {
          await createDefaultProfile();
        }
      } else {
        loadProfiles();
      }
    } catch (err) {
      console.error('Failed to delete profile:', err);
      alert('Failed to delete profile: ' + err.message);
    } finally {
      setShowDeleteConfirm(false);
      setProfileToDelete(null);
    }
  };

  const handleSaveProfile = async (profileData) => {
    try {
      console.log('handleSaveProfile called with:', profileData);
      console.log('modalMode:', modalMode);
      
      if (modalMode === 'create') {
        console.log('Creating profile...');
        const result = await window.electronAPI.storage.profiles.create(profileData);
        console.log('Create result:', result);
        
        if (result.success) {
          console.log('Profile created successfully, reloading profiles...');
          await loadProfiles();
          alert('Profile created successfully!');
        } else {
          console.error('Profile creation failed:', result.error);
          alert('Failed to create profile: ' + result.error);
        }
      } else if (modalMode === 'edit' && editingProfile) {
        console.log('Updating profile:', editingProfile.id);
        const result = await window.electronAPI.storage.profiles.update(
          editingProfile.id, 
          profileData
        );
        console.log('Update result:', result);
        
        if (result.success) {
          console.log('Profile updated successfully, reloading profiles...');
          await loadProfiles();
          alert('Profile updated successfully!');
        } else {
          console.error('Profile update failed:', result.error);
          alert('Failed to update profile: ' + result.error);
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      throw err;
    }
  };

  const handleImportProfile = async () => {
    try {
      const result = await window.electronAPI.importProfile();
      if (result.success) {
        await loadProfiles();
        alert('Profile imported successfully!');
      }
    } catch (err) {
      console.error('Failed to import profile:', err);
      alert('Failed to import profile: ' + err.message);
    }
  };

  const handleExportProfile = async (profile, e) => {
    e.stopPropagation();
    try {
      const result = await window.electronAPI.exportProfile(profile.id);
      if (result.success) {
        alert('Profile exported successfully!');
      }
    } catch (err) {
      console.error('Failed to export profile:', err);
      alert('Failed to export profile: ' + err.message);
    }
  };

  if (!expanded) {
    console.log('ProfileMenu rendering (collapsed), currentProfile:', currentProfile);
    return (
      <button
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-[#2a2a2a] transition-colors w-full"
        onClick={() => {
          if (onInteraction) onInteraction();
          setIsOpen(!isOpen);
        }}
      >
        <UserCircleIcon className="w-7 h-7 min-w-[28px]" />
      </button>
    );
  }

  console.log('ProfileMenu rendering (expanded), currentProfile:', currentProfile, 'profiles:', profiles, 'loading:', loading, 'isOpen:', isOpen);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => {
          if (onInteraction) onInteraction();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-[#2a2a2a] transition-colors w-full"
      >
        <UserCircleIcon className="w-7 h-7 min-w-[28px]" />
        <div className="flex flex-col text-left flex-1">
          <span className="text-sm font-medium text-white">
            {currentProfile?.name || 'Guest'}
          </span>
          <span className="text-xs text-gray-500">View Profile</span>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden z-50">
          {/* Current Profiles List */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
            ) : profiles.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">No profiles</div>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] cursor-pointer group"
                >
                  <UserCircleIcon className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {profile.name}
                    </div>
                    {profile.description && (
                      <div className="text-xs text-gray-500">{profile.description}</div>
                    )}
                  </div>
                  {currentProfile?.id === profile.id && (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditProfile(profile, e)}
                      className="p-1 rounded hover:bg-[#3a3a3a] text-green-500"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleExportProfile(profile, e)}
                      className="p-1 rounded hover:bg-[#3a3a3a] text-green-400"
                      title="Export"
                    >
                      <ArrowUpTrayIcon className="w-4 h-4" />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteProfile(profile, e)}
                        className="p-1 rounded hover:bg-[#3a3a3a] text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-[#2a2a2a] p-2 space-y-1">
            <button
              onClick={handleCreateProfile}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#2a2a2a] text-green-500 text-sm w-full"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create New Profile</span>
            </button>
            <button
              onClick={handleImportProfile}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#2a2a2a] text-green-400 text-sm w-full"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Import Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showModal && (
        <ProfileModal
          mode={modalMode}
          profile={editingProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Profile"
          message={`Are you sure you want to delete "${profileToDelete?.name}"? This will permanently delete all chats and settings associated with this profile.`}
          confirmText="Delete"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setProfileToDelete(null);
          }}
        />
      )}
    </div>
  );
}

export default ProfileMenu;
