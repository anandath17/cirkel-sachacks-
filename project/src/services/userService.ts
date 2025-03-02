import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../types/user';
import { BADGES } from '../constants/badges';

const isEarlyAdopter = (date: Date) => {
  const startDate = new Date('2024-12-01');
  const endDate = new Date('2025-02-29');
  return date >= startDate && date <= endDate;
};

export interface PremiumSubscription {
  isActive: boolean;
  startDate: string;
  endDate: string;
  plan: 'monthly' | 'yearly';
  autoRenew: boolean;
  storage: {
    total: number;
    used: number;
  };
  projectLimits: {
    maxProjects: number;
    currentProjects: number;
  };
}

export async function createUserProfile(userId: string, data: Partial<UserProfile>) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const userRef = doc(db, 'users', userId);
    const creationDate = new Date();
    
    // Initialize premium status
    const premiumData = {
      isActive: false,
      startDate: '',
      endDate: '',
      plan: 'monthly',
      autoRenew: false,
      storage: {
        total: 512 * 1024 * 1024, // Free users get 512MB
        used: 0
      },
      projectLimits: {
        maxProjects: 3,
        currentProjects: 0
      }
    };

    // Initialize badges
    const initialBadges = BADGES.filter(badge => badge.id === 'contributor').map(badge => ({
      ...badge,
      isLocked: false,
      earnedAt: creationDate.toISOString()
    }));

    const profileData = {
      ...cleanData,
      id: userId,
      badges: initialBadges,
      displayedBadges: ['contributor'],
      premium: premiumData,
      isPremium: false,
      createdAt: creationDate,
      updatedAt: creationDate,
      // Ensure profile fields have defaults
      skills: cleanData.skills || [],
      projectPreferences: cleanData.projectPreferences || [],
      languages: cleanData.languages || [],
      collaborationPreferences: cleanData.collaborationPreferences || [],
      weeklyAvailability: cleanData.weeklyAvailability || 40,
      profileImage: cleanData.profileImage || null,
      profileEmoji: cleanData.profileEmoji || null,
      profileColor: cleanData.profileColor || null,
      // Initialize stats
      stats: {
        projectsCount: 0,
        followersCount: 0,
        followingCount: 0
      }
    };

    await setDoc(userRef, profileData);
    return profileData as UserProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function activatePremium(
  userId: string, 
  plan: 'monthly' | 'yearly'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const startDate = new Date();
    const endDate = new Date();
    
    // Set end date based on plan
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const premiumData: PremiumSubscription = {
      isActive: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      plan,
      autoRenew: true,
      storage: {
        total: 10 * 1024 * 1024 * 1024, // Premium users get 10GB in bytes
        used: 0 // Maintain existing used storage
      },
      projectLimits: {
        maxProjects: 999999, // Unlimited projects for premium users
        currentProjects: 0 // Will be updated with current project count
      }
    };

    // Get current project count
    const projectsRef = collection(db, 'projects');
    const projectsQuery = query(projectsRef, where('ownerId', '==', userId));
    const projectsSnapshot = await getDocs(projectsQuery);
    const currentProjectCount = projectsSnapshot.size;

    // Update premium data with current project count
    premiumData.projectLimits.currentProjects = currentProjectCount;

    // Update user profile with premium status
    await updateDoc(userRef, {
      premium: premiumData,
      isPremium: true,
      updatedAt: new Date(),
      'badges': arrayUnion({
        ...BADGES.find(b => b.id === 'premium'),
        isLocked: false,
        earnedAt: startDate.toISOString()
      })
    });
  } catch (error) {
    console.error('Error activating premium:', error);
    throw error;
  }
}

export async function deactivatePremium(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Get current user data
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    // Prepare basic premium data
    const premiumData: PremiumSubscription = {
      isActive: false,
      startDate: '',
      endDate: '',
      plan: 'monthly',
      autoRenew: false,
      storage: {
        total: 512 * 1024 * 1024, // Reset to free tier (512MB in bytes)
        used: userData?.premium?.storage?.used || 0 // Maintain used storage value
      },
      projectLimits: {
        maxProjects: 3, // Reset to free tier (3 projects)
        currentProjects: userData?.premium?.projectLimits?.currentProjects || 0
      }
    };
    
    // Update user profile to remove premium status
    await updateDoc(userRef, {
      premium: premiumData,
      isPremium: false,
      updatedAt: new Date(),
      // Lock premium badge
      'badges': arrayRemove({
        ...BADGES.find(b => b.id === 'premium'),
        isLocked: false
      })
    });
  } catch (error) {
    console.error('Error deactivating premium:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        // Ensure all fields have defaults
        skills: data.skills || [],
        projectPreferences: data.projectPreferences || [],
        languages: data.languages || [],
        collaborationPreferences: data.collaborationPreferences || [],
        weeklyAvailability: data.weeklyAvailability || 40,
        badges: data.badges || [],
        displayedBadges: data.displayedBadges || ['contributor'],
        profileImage: data.profileImage || null,
        profileEmoji: data.profileEmoji || null,
        profileColor: data.profileColor || null,
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        // Ensure stats have defaults
        stats: data.stats || {
          projectsCount: 0,
          followersCount: 0,
          followingCount: 0
        }
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    
    // Clean undefined values
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Add timestamp
    cleanData.updatedAt = new Date();

    await updateDoc(userRef, cleanData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}