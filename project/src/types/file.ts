export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  source: 'discussion' | 'chat' | 'manual';
  projectId: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  projectId: string;
  isSystemFolder?: boolean;
}

export interface FileSystemState {
  files: FileItem[];
  folders: Folder[];
  currentPath: string;
  selectedItems: string[];
  isLoading: boolean;
  error?: string;
}

export const FILE_LIMITS = {
  maxFileSize: 100 * 1024 * 1024, // 100MB per file
  totalStorageFree: 512 * 1024 * 1024, // 512MB for free tier
  totalStoragePremium: 10 * 1024 * 1024 * 1024, // 10GB for premium tier
  allowedTypes: '*/*', // All file types
  maxFileCount: 10, // Maximum 10 files at once
};

export function getTotalStorageLimit(isPremium: boolean): number {
  return isPremium ? FILE_LIMITS.totalStoragePremium : FILE_LIMITS.totalStorageFree;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_LIMITS.maxFileSize) {
    return {
      valid: false,
      error: `File terlalu besar. Maksimum ukuran file adalah ${formatFileSize(FILE_LIMITS.maxFileSize)}`
    };
  }

  return { valid: true };
} 