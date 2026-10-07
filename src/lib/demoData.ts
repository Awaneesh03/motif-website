// Static demo data for first-time user experience
// This data is NEVER written to the database - UI only

import type { Idea } from './ideasService';

// Demo startup examples for Founders
export const demoFounderStartups: (Idea & { demoDescription?: string })[] = [
  {
    id: 'demo-startup-1',
    title: 'EcoTrack',
    name: 'EcoTrack',
    stage: 'MVP',
    status: 'draft',
    user_id: 'demo-user',
    created_at: new Date().toISOString(),
    demoDescription: 'AI-powered carbon footprint tracker for businesses',
  },
  {
    id: 'demo-startup-2',
    title: 'SkillMatch AI',
    name: 'SkillMatch AI',
    stage: 'Seed',
    status: 'pending_review',
    user_id: 'demo-user',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    demoDescription: 'Machine learning platform connecting job seekers with perfect roles',
  },
  {
    id: 'demo-startup-3',
    title: 'HealthBridge',
    name: 'HealthBridge',
    stage: 'Series A',
    status: 'approved_for_vc',
    user_id: 'demo-user',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    demoDescription: 'Telemedicine platform connecting patients with specialists',
  },
];

export const demoAdminMetrics = {
  totalFounders: 24,
  totalVCs: 8,
  totalStartups: 47,
  pendingReview: 6,
  approvedStartups: 32,
  totalIntroRequests: 18,
  approvedIntroRequests: 12,
  conversionRate: 67,
};
