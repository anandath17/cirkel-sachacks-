import type { PremiumSubscription } from '../services/userService';

export interface User {
  id: string;
  fullName: string;
  bio: string;
  avatar?: string;
  banner?: string;
  skills: string[];
  availability: 'available' | 'busy' | 'unavailable';
  location: string;
  professionalTitle: string;
  experienceLevel: string;
  yearsOfExperience: number;
  languages: string[];
  collaborationStyles: string[];
  weeklyAvailability: number;
  socialLinks: Record<string, string>;
  stats: {
    projectsCount: number;
    followersCount: number;
    followingCount: number;
  };
  joinedAt: string;
  badges?: Badge[];
  displayedBadges?: string[];
  isPremium?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  banner?: string;
  profileImage?: string;
  bio?: string;
  professionalTitle?: string;
  country?: string;
  timezone?: string;
  experienceLevel?: string;
  yearsOfExperience?: number;
  skills?: string[];
  languages?: string[];
  projectPreferences?: string[];
  collaborationPreferences?: string[];
  weeklyAvailability?: number;
  createdAt?: string;
  updatedAt?: string;
  profileColor?: string;
  profileEmoji?: string;
  // Premium fields
  isPremium: boolean;
  premium: PremiumSubscription;
  // Notification settings
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  projectUpdates?: boolean;
  chatNotifications?: boolean;
  // Appearance settings
  darkMode?: boolean;
  language?: string;
  // Privacy settings
  profileVisibility?: 'public' | 'private';
  showOnlineStatus?: boolean;
  showActivity?: boolean;
  twoFactorEnabled?: boolean;
  theme?: 'light' | 'dark' | 'system';
  badges?: Badge[];
  displayedBadges?: string[]; // IDs of badges to display
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  type: 'premium' | 'contributor' | 'verified' | 'founder';
  isLocked: boolean;
  userId?: string; // For special badges like founder that are tied to specific users
}

export interface PremiumSubscription {
  isActive: boolean;
  startDate: string;
  endDate: string;
  plan: 'monthly' | 'yearly';
  autoRenew: boolean;
  storage: {
    total: number; // in GB
    used: number; // in GB
  };
  projectLimits: {
    maxProjects: number;
    currentProjects: number;
  };
}