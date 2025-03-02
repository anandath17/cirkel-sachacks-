import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProfilePictureEditor } from './ProfilePictureEditor';

interface ProfilePictureModalProps {
  onClose: () => void;
}

type EditMode = 'profile' | 'banner';

export function ProfilePictureModal({ onClose }: ProfilePictureModalProps) {
  const [editMode, setEditMode] = useState<EditMode>('profile');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium">
            {editMode === 'profile' ? 'Edit Profile Picture' : 'Edit Banner Image'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setEditMode('profile')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              editMode === 'profile'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Profile Picture
          </button>
          <button
            onClick={() => setEditMode('banner')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              editMode === 'banner'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Banner Image
          </button>
        </div>

        <ProfilePictureEditor onClose={onClose} mode={editMode} />
      </motion.div>
    </motion.div>
  );
}