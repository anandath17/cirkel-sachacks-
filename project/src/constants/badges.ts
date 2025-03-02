import type { Badge } from '../types/user';

export const BADGES: Badge[] = [
  {
    id: 'premium',
    title: 'Premium',
    description: 'Premium member with exclusive features',
    icon: '👑',
    earnedAt: new Date().toISOString(),
    type: 'premium',
    isLocked: false
  }
]; 