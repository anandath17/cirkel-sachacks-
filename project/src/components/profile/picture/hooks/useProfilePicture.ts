import { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { uploadProfileImage, deleteProfileImage } from '../../../../services/storageService';

export function useProfilePicture(onClose: () => void) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile, userProfile, refreshUserProfile } = useAuth();

  const handleUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Invalid file type. Please select an image file.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Store the old image URL for cleanup
      const oldImageUrl = userProfile?.profileImage;

      // Upload new image first
      const imageUrl = await uploadProfileImage(file);
      
      // Update profile with new image and clear emoji/color
      const updateData = {
        profileImage: imageUrl,
        profileEmoji: null,
        profileColor: null,
        updatedAt: new Date()
      };

      // Update profile
      await updateProfile(updateData);

      // Force a profile refresh to ensure the UI updates
      await refreshUserProfile();

      // If successful and there's an old image, try to delete it
      if (oldImageUrl && oldImageUrl !== imageUrl) {
        try {
          await deleteProfileImage(oldImageUrl);
        } catch (error) {
          // Just log the error but don't fail the update
          console.warn('Failed to delete old profile image:', error);
        }
      }
      
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload image');
      console.error('Error uploading image:', error);
      
      // Try to refresh profile in case of error to ensure UI is in sync
      try {
        await refreshUserProfile();
      } catch (refreshError) {
        console.error('Error refreshing profile after upload error:', refreshError);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    error,
    handleUpload
  };
}