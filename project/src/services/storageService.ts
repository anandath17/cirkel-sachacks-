import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PROJECT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BANNER_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadProfileImage(file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    throw new Error(`File size too large. Maximum ${MAX_PROFILE_IMAGE_SIZE / (1024 * 1024)}MB`);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed (jpg, png, gif)');
  }

  const acceptedFormats = ['image/jpeg', 'image/png', 'image/gif'];
  if (!acceptedFormats.includes(file.type)) {
    throw new Error('Unsupported file format. Use JPG, PNG, or GIF');
  }

  try {
    // Generate a unique filename with timestamp and original extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `profile_${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
    const filePath = `profile-images/${filename}`;
    const storageRef = ref(storage, filePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get and return the download URL
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile picture. Please try again.');
  }
}

export async function uploadProjectImage(file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_PROJECT_IMAGE_SIZE) {
    throw new Error(`File size too large. Maximum ${MAX_PROJECT_IMAGE_SIZE / (1024 * 1024)}MB`);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed (jpg, png, gif)');
  }

  const acceptedFormats = ['image/jpeg', 'image/png', 'image/gif'];
  if (!acceptedFormats.includes(file.type)) {
    throw new Error('Unsupported file format. Use JPG, PNG, or GIF');
  }

  try {
    // Generate a unique filename with timestamp and original extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `project_${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
    const filePath = `project-images/${filename}`;
    const storageRef = ref(storage, filePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get and return the download URL
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading project image:', error);
    throw new Error('Failed to upload project image. Please try again.');
  }
}

export async function uploadBannerImage(file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_BANNER_IMAGE_SIZE) {
    throw new Error(`File size too large. Maximum ${MAX_BANNER_IMAGE_SIZE / (1024 * 1024)}MB`);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed (jpg, png, gif)');
  }

  const acceptedFormats = ['image/jpeg', 'image/png', 'image/gif'];
  if (!acceptedFormats.includes(file.type)) {
    throw new Error('Unsupported file format. Use JPG, PNG, or GIF');
  }

  try {
    // Generate a unique filename with timestamp and original extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `banner_${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
    const filePath = `banner-images/${filename}`;
    const storageRef = ref(storage, filePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get and return the download URL
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading banner image:', error);
    throw new Error('Failed to upload banner image. Please try again.');
  }
}

function getStoragePathFromUrl(url: string): string | null {
  try {
    // Extract the path from the Firebase Storage URL
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    if (!url.startsWith(baseUrl)) return null;

    // Get the path after /o/
    const parts = url.split('/o/');
    if (parts.length !== 2) return null;

    // Remove query parameters and decode the path
    const pathWithoutParams = parts[1].split('?')[0];
    return decodeURIComponent(pathWithoutParams);
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
}

export async function deleteProfileImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  try {
    // Get the storage path from the URL
    const storagePath = getStoragePathFromUrl(imageUrl);
    if (!storagePath) {
      console.warn('Invalid storage URL:', imageUrl);
      return;
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // If file not found, we can ignore the error
    if (error.code === 'storage/object-not-found') {
      console.log('Profile image already deleted or does not exist');
      return;
    }
    console.error('Error deleting profile image:', error);
    throw new Error('Failed to delete profile picture. Please try again.');
  }
}

export async function deleteProjectImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  try {
    // Get the storage path from the URL
    const storagePath = getStoragePathFromUrl(imageUrl);
    if (!storagePath) {
      console.warn('Invalid storage URL:', imageUrl);
      return;
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // If file not found, we can ignore the error
    if (error.code === 'storage/object-not-found') {
      console.log('Project image already deleted or does not exist');
      return;
    }
    console.error('Error deleting project image:', error);
    throw new Error('Failed to delete project image. Please try again.');
  }
}

export async function deleteBannerImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  try {
    // Get the storage path from the URL
    const storagePath = getStoragePathFromUrl(imageUrl);
    if (!storagePath) {
      console.warn('Invalid storage URL:', imageUrl);
      return;
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // If file not found, we can ignore the error
    if (error.code === 'storage/object-not-found') {
      console.log('Banner image already deleted or does not exist');
      return;
    }
    console.error('Error deleting banner image:', error);
    throw new Error('Failed to delete banner image. Please try again.');
  }
}