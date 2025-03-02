import { useRef, useState } from 'react';
import { Button } from '../../../ui/Button';
import { useAuth } from '../../../../contexts/AuthContext';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
}

export function FileUploader({ 
  onFileSelect, 
  isUploading, 
  isDragging,
  onDragStateChange 
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const handleFileSelection = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Pass file to parent
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragStateChange(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelection(file);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center ${
        isDragging ? 'border-black bg-gray-50' : 'border-gray-200'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelection(file);
        }}
        className="hidden"
      />
      
      <div className="mb-4">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : userProfile?.avatar ? (
            <img
              src={userProfile.avatar}
              alt="Current profile"
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
      </div>
      
      <p className="text-gray-600 mb-4">
        {previewUrl ? 'Click upload to save your photo, or' : 'Drag and drop your photo here, or'}
      </p>
      <Button
        onClick={() => fileInputRef.current?.click()}
        loading={isUploading}
      >
        {previewUrl ? 'Choose Different Photo' : userProfile?.avatar ? 'Change Photo' : 'Choose File'}
      </Button>
    </div>
  );
}