import { useState, useRef } from 'react';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { uploadProfileImage, uploadBannerImage, deleteProfileImage, deleteBannerImage } from '../../../services/storageService';

interface ProfilePictureEditorProps {
  onClose: () => void;
  mode: 'profile' | 'banner';
}

export function ProfilePictureEditor({ onClose, mode }: ProfilePictureEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userProfile, refreshUserProfile } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.id) return;

    setIsUploading(true);
    setError(null);

    try {
      // Delete existing image if it exists
      if (mode === 'profile' && userProfile.avatar) {
        await deleteProfileImage(userProfile.avatar);
      } else if (mode === 'banner' && userProfile.banner) {
        await deleteBannerImage(userProfile.banner);
      }

      // Upload new image
      const imageUrl = mode === 'profile' 
        ? await uploadProfileImage(file)
        : await uploadBannerImage(file);

      // Update user profile in Firestore
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, {
        [mode === 'profile' ? 'avatar' : 'banner']: imageUrl,
      });

      // Refresh user profile data
      await refreshUserProfile();
      onClose();
    } catch (err) {
      console.error('Error updating image:', err);
      setError(err instanceof Error ? err.message : 'Failed to update image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!userProfile?.id) return;

    setIsUploading(true);
    setError(null);

    try {
      // Delete existing image if it exists
      if (mode === 'profile' && userProfile.avatar) {
        await deleteProfileImage(userProfile.avatar);
      } else if (mode === 'banner' && userProfile.banner) {
        await deleteBannerImage(userProfile.banner);
      }

      // Update user profile in Firestore
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, {
        [mode === 'profile' ? 'avatar' : 'banner']: null,
      });

      // Refresh user profile data
      await refreshUserProfile();
      onClose();
    } catch (err) {
      console.error('Error removing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Image Preview */}
      <div className="relative">
        {mode === 'profile' ? (
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[3/1] rounded-xl overflow-hidden bg-gray-100">
            {userProfile?.banner ? (
              <img
                src={userProfile.banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <svg
                  className="w-12 h-12 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">No banner image</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex flex-col gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
        <Button
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : `Upload ${mode === 'profile' ? 'Profile Picture' : 'Banner Image'}`}
        </Button>
        {(mode === 'profile' ? userProfile?.avatar : userProfile?.banner) && (
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={isUploading}
            className="w-full"
          >
            Remove {mode === 'profile' ? 'Profile Picture' : 'Banner Image'}
          </Button>
        )}
      </div>
    </div>
  );
}