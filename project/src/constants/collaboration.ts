export type CollaborationType = 'Remote' | 'Hybrid' | 'On-site';

export const COLLABORATION_TYPES: CollaborationType[] = ['Remote', 'Hybrid', 'On-site'];

export const COLLABORATION_LABELS: Record<CollaborationType, string> = {
  'Remote': 'Jarak Jauh',
  'Hybrid': 'Hybrid',
  'On-site': 'Di Tempat'
};