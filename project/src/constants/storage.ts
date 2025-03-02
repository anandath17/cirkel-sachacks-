// Storage limits in bytes
export const STORAGE_LIMITS = {
  FREE: 512 * 1024 * 1024, // 512MB
  PREMIUM: 10 * 1024 * 1024 * 1024, // 10GB
};

// Project limits
export const PROJECT_LIMITS = {
  FREE: 1,
  PREMIUM: 999999,
};

// Membership tiers with features
export const MEMBERSHIP_TIERS = {
  free: {
    name: 'free',
    projectLimit: PROJECT_LIMITS.FREE,
    storageLimit: STORAGE_LIMITS.FREE,
    features: [
      'Basic chat & communication',
      'Limited file sharing',
      'Project card creation',
      'View public projects',
      'Join as contributor',
      'Basic profile customization'
    ]
  },
  premium: {
    name: 'premium',
    projectLimit: PROJECT_LIMITS.PREMIUM,
    storageLimit: STORAGE_LIMITS.PREMIUM,
    features: [
      'Voice channels',
      'Screen sharing',
      'Advanced file management',
      'Custom roles creation',
      'Analytics dashboard',
      'Priority in discovery',
      'Custom project card design',
      'Priority support',
      'Limited API access'
    ]
  }
}; 