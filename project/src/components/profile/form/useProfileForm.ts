import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import type { ProfileFormData } from './types';
import { BADGES } from '../../../constants/badges';

export function useProfileForm() {
  const { userProfile, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>(() => {
    // Initialize with default contributor badge if no badges are set
    const defaultDisplayedBadges = userProfile?.displayedBadges || ['contributor'];
    const defaultBadges = userProfile?.badges || BADGES.filter(badge => badge.id === 'contributor');

    return {
      fullName: userProfile?.fullName || '',
      professionalTitle: userProfile?.professionalTitle || '',
      bio: userProfile?.bio || '',
      skills: userProfile?.skills || [],
      projectPreferences: userProfile?.projectPreferences || [],
      collaborationPreferences: userProfile?.collaborationPreferences || [],
      languages: userProfile?.languages || [],
      country: userProfile?.country || '',
      weeklyAvailability: userProfile?.weeklyAvailability || 0,
      displayedBadges: defaultDisplayedBadges,
    };
  });

  // Update form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData(prevData => ({
        ...prevData,
        fullName: userProfile.fullName || prevData.fullName,
        professionalTitle: userProfile.professionalTitle || prevData.professionalTitle,
        bio: userProfile.bio || prevData.bio,
        skills: userProfile.skills || prevData.skills,
        projectPreferences: userProfile.projectPreferences || prevData.projectPreferences,
        collaborationPreferences: userProfile.collaborationPreferences || prevData.collaborationPreferences,
        languages: userProfile.languages || prevData.languages,
        country: userProfile.country || prevData.country,
        weeklyAvailability: userProfile.weeklyAvailability || prevData.weeklyAvailability,
        displayedBadges: userProfile.displayedBadges || ['contributor'],
      }));
    }
  }, [userProfile]);

  const handleChange = (newData: ProfileFormData) => {
    setFormData(newData);
  };

  const handleSubmit = async () => {
    try {
      if (updateProfile) {
        await updateProfile(formData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  };

  return {
    formData,
    handleChange,
    handleSubmit,
    isLoading: false, // Tambahkan state loading jika diperlukan
  };
} 