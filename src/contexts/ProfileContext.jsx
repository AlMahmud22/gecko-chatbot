import { createContext, useContext, useState, useEffect } from 'react';
import { useElectronApi } from './ElectronApiContext';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { isApiReady } = useElectronApi();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, [isApiReady]);

  const loadProfiles = async () => {
    if (!isApiReady || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.storage.profiles.getAll();
      const profileList = result?.profiles || [];
      
      // Ensure default profile exists
      if (profileList.length === 0) {
        const createResult = await window.electronAPI.storage.profiles.create({
          name: 'Guest',
          description: 'Default profile',
          isDefault: true,
        });
        
        if (createResult.success) {
          setProfiles([createResult.profile]);
          setCurrentProfile(createResult.profile);
          localStorage.setItem('currentProfileId', createResult.profile.id);
        }
      } else {
        setProfiles(profileList);
        
        // Load current profile from localStorage or use first profile
        const savedProfileId = localStorage.getItem('currentProfileId');
        const current = profileList.find(p => p.id === savedProfileId) || profileList[0];
        setCurrentProfile(current);
        localStorage.setItem('currentProfileId', current.id);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentProfileId', profile.id);
  };

  const refreshProfiles = async () => {
    await loadProfiles();
  };

  return (
    <ProfileContext.Provider 
      value={{ 
        currentProfile, 
        profiles, 
        loading, 
        switchProfile, 
        refreshProfiles 
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
