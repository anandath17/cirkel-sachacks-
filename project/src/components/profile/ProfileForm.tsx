import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { ProfileFormFields } from './form/ProfileFormFields';
import { toast } from 'react-hot-toast';
import { useProfileForm } from './form/useProfileForm';
import type { CollaborationType } from '../../constants/collaboration';

export function ProfileForm() {
  const { userProfile, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formData, handleChange, handleSubmit } = useProfileForm();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast.error('No user profile found');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const toastId = toast.loading('Saving changes...');
      const success = await handleSubmit();
      if (success) {
        toast.success('Profile updated successfully! 🎉', {
          id: toastId,
        });
      } else {
        toast.error('Failed to update profile 😔', {
          id: toastId,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile 😔');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 px-8 py-6">
      <ProfileFormFields
        formData={formData}
        onChange={handleChange}
      />

      <div className="flex justify-end pt-8">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}