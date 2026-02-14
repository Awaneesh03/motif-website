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

// Demo activity timeline items
export const demoActivityItems = [
  {
    id: 'demo-activity-1',
    type: 'startup_submitted' as const,
    title: 'Startup Submitted',
    message: 'Your startup "SkillMatch AI" has been submitted for review',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    isRead: false,
    userId: 'demo-user',
  },
  {
    id: 'demo-activity-2',
    type: 'startup_approved' as const,
    title: 'Startup Approved',
    message: 'Congratulations! "HealthBridge" has been approved and is now visible to VCs',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isRead: true,
    userId: 'demo-user',
  },
  {
    id: 'demo-activity-3',
    type: 'vc_intro_requested' as const,
    title: 'VC Introduction Requested',
    message: 'Sarah Chen from Acme Ventures requested an intro to "HealthBridge"',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    isRead: true,
    userId: 'demo-user',
  },
];

// Demo metrics for display
export const demoFounderMetrics = {
  totalStartups: 3,
  draftStartups: 1,
  pendingReview: 1,
  approvedForVC: 1,
  rejectedStartups: 0,
  activeConnections: 1,
};

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

// Helper to check if an item is demo data
export const isDemoItem = (id: string): boolean => {
  return id.startsWith('demo-');
};

// Demo tooltips and explanations
export const demoTooltips = {
  founder: {
    draft: 'This is a sample draft startup. Complete your pitch and submit for review.',
    pending: 'Example of a startup under review by the Motif team.',
    approved: 'Example of an approved startup visible to VCs.',
    cta: 'Ready to create your first real startup?',
  },
  admin: {
    metrics: 'These are example metrics to show how the platform tracks performance.',
    approval: 'This shows how you review and approve founder submissions.',
  },
};
