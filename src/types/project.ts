export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  problem: string;
  solution: string;
  coverImage?: string;
  status: 'open' | 'closed' | 'completed' | 'archived';
  skills: string[];
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  members: ProjectMember[];
  phase: 'idea' | 'prototype' | 'development' | 'growth' | 'maintenance';
  category: 'web' | 'mobile' | 'desktop' | 'backend' | 'ai' | 'data' | 'blockchain' | 
           'game' | 'iot' | 'robotics' | 'cloud' | 'security' | 'ar_vr' | 'network' | 
           'embedded' | 'research' | 'education' | 'business' | 'finance' | 'healthcare' |
           'art' | 'music' | 'photo' | 'video' | 'commerce' | 'innovation' | 'social' |
           'creative' | 'other';
  visibility: 'public' | 'private';
  tags: string[];
  requiredRoles: ProjectRole[];
  milestones: ProjectMilestone[];
  images?: Array<{
    url: string;
    caption?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  websiteUrl?: string;
  problemStatement?: string;
  expectedOutcomes?: string;
  targetAudience?: string;
  projectGoals?: string[];
} 