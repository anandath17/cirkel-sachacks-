import { User } from '../types/user';
import { Project } from '../types/project';

// Date constant for filtering (March 1st, 2024 00:00:00 UTC)
export const FILTER_DATE = '2024-03-01T00:00:00Z';

export function isUserVisibleForHackathon(user: User): boolean {
  if (!user.createdAt && !user.joinedAt) return true;
  
  const userDate = user.joinedAt || user.createdAt;
  return new Date(userDate) >= new Date(FILTER_DATE);
}

export function isProjectVisibleForHackathon(project: Project): boolean {
  if (!project.createdAt) return true;
  
  return new Date(project.createdAt) >= new Date(FILTER_DATE);
} 