import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile, updateUserProfile } from '../services/userService';
import { uploadProfileImage } from '../services/storageService';
import type { UserProfile } from '../types/user';
import type { RegistrationData } from '../types/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logWithMask } from '@/utils/logger';
import { DEFAULT_ACHIEVEMENTS } from '../constants/achievements';
import { BADGES } from '../constants/badges';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  signup: (email: string, password: string, data: RegistrationData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unsubscribeProfile, setUnsubscribeProfile] = useState<(() => void) | null>(null);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setCurrentUser(user);
      
      if (!user) {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          setUnsubscribeProfile(null);
        }
        setUserProfile(null);
        setIsLoading(false);
      } else {
        // Initial profile fetch
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error fetching initial profile:', error);
        }
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [unsubscribeProfile]);

  // Handle profile updates
  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up profile listener for user:', currentUser.uid);
    const userDocRef = doc(db, 'users', currentUser.uid);

    const unsubscribe = onSnapshot(userDocRef, {
      next: async (doc) => {
        try {
          logWithMask('Profile document changed:', doc.data());
          
          if (doc.exists()) {
            const data = doc.data();
            const profileData = {
              ...data,
              id: doc.id,
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              // Ensure all required fields are present with defaults
              fullName: data.fullName || currentUser.displayName || '',
              email: data.email || currentUser.email || '',
              skills: data.skills || [],
              projectPreferences: data.projectPreferences || [],
              languages: data.languages || [],
              collaborationPreferences: data.collaborationPreferences || [],
              weeklyAvailability: data.weeklyAvailability || 40,
              badges: data.badges || BADGES.filter(badge => badge.id === 'contributor'),
              displayedBadges: data.displayedBadges || ['contributor'],
              // Ensure profile picture related fields are properly handled
              profileImage: data.profileImage || null,
              profileEmoji: data.profileEmoji || null,
              profileColor: data.profileColor || null,
            } as UserProfile;

            // Ensure Firebase Auth display name is in sync
            if (profileData.fullName && profileData.fullName !== currentUser.displayName) {
              await updateFirebaseProfile(currentUser, {
                displayName: profileData.fullName
              });
            }

            logWithMask('Setting user profile:', profileData);
            setUserProfile(profileData);
          } else {
            console.log('Profile document does not exist');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error processing profile update:', error);
        }
      },
      error: (error) => {
        console.error('Error listening to profile changes:', error);
      }
    });

    setUnsubscribeProfile(() => unsubscribe);
    return () => unsubscribe();
  }, [currentUser]);

  async function signup(email: string, password: string, data: RegistrationData) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateFirebaseProfile(user, { 
      displayName: data.fullName
    });

    let profileImage;
    if (data.profileImage) {
      try {
        const imageFile = await fetch(data.profileImage).then(r => r.blob());
        profileImage = await uploadProfileImage(new File([imageFile], 'profile.jpg', { type: 'image/jpeg' }));
      } catch (error) {
        console.error('Error uploading profile picture:', error);
      }
    }

    const profileData: Partial<UserProfile> = {
      email,
      fullName: data.fullName,
      professionalTitle: data.professionalTitle,
      bio: data.bio,
      skills: data.skills || [],
      projectPreferences: data.projectPreferences || [],
      collaborationPreferences: data.collaborationStyles?.map(style => 
        style as 'Remote' | 'Hybrid' | 'On-site'
      ) || [],
      country: data.country || '',
      languages: data.languages || [],
      weeklyAvailability: data.weeklyAvailability || 40,
      profileImage: profileImage || null,
      profileEmoji: data.profileEmoji || null,
      profileColor: data.profileColor || null,
      badges: BADGES.filter(badge => badge.id === 'contributor'),
      displayedBadges: ['contributor'],
      updatedAt: new Date(),
    };

    await createUserProfile(user.uid, profileData);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (unsubscribeProfile) {
      unsubscribeProfile();
      setUnsubscribeProfile(null);
    }
    await signOut(auth);
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!currentUser) throw new Error('No user logged in');
    if (!userProfile) throw new Error('No user profile found');

    try {
      console.log('Updating profile with data:', data);
      
      const updatedData = {
        ...data,
        updatedAt: new Date()
      };

      // Update Firebase Auth displayName if fullName changes
      if (data.fullName && data.fullName !== currentUser.displayName) {
        await updateFirebaseProfile(currentUser, {
          displayName: data.fullName
        });
      }

      // Update Firestore
      await updateUserProfile(currentUser.uid, updatedData);
      
      // Update local state immediately for better UX
      setUserProfile(prev => prev ? { ...prev, ...updatedData } : null);
      
      console.log('Profile update successful');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async function refreshUserProfile() {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      const profile = await getUserProfile(currentUser.uid);
      if (profile) {
        // Ensure all required fields are present
        const updatedProfile = {
          ...profile,
          id: currentUser.uid,
          fullName: profile.fullName || currentUser.displayName || '',
          email: profile.email || currentUser.email || '',
          skills: profile.skills || [],
          projectPreferences: profile.projectPreferences || [],
          languages: profile.languages || [],
          collaborationPreferences: profile.collaborationPreferences || [],
          weeklyAvailability: profile.weeklyAvailability || 40,
          badges: profile.badges || BADGES.filter(badge => badge.id === 'contributor'),
          displayedBadges: profile.displayedBadges || ['contributor'],
          profileImage: profile.profileImage || null,
          profileEmoji: profile.profileEmoji || null,
          profileColor: profile.profileColor || null,
          updatedAt: profile.updatedAt || new Date(),
        };

        // Update Firebase Auth displayName to ensure sync
        if (updatedProfile.fullName !== currentUser.displayName) {
          await updateFirebaseProfile(currentUser, {
            displayName: updatedProfile.fullName
          });
        }

        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    updateProfile,
    refreshUserProfile,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export { useAuth };