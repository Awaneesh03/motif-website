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
    created_by: 'demo-user',
    created_at: new Date().toISOString(),
    demoDescription: 'AI-powered carbon footprint tracker for businesses',
  },
  {
    id: 'demo-startup-2',
    title: 'SkillMatch AI',
    name: 'SkillMatch AI',
    stage: 'Seed',
    status: 'pending_review',
    created_by: 'demo-user',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    demoDescription: 'Machine learning platform connecting job seekers with perfect roles',
  },
  {
    id: 'demo-startup-3',
    title: 'HealthBridge',
    name: 'HealthBridge',
    stage: 'Series A',
    status: 'approved_for_vc',
    created_by: 'demo-user',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    demoDescription: 'Telemedicine platform connecting patients with specialists',
  },
];

// Demo VCs for display purposes
export const demoVCProfiles = [
  {
    id: 'demo-vc-1',
    name: 'Sarah Chen',
    firm: 'Acme Ventures',
    role: 'Partner',
    focus: 'B2B SaaS, AI/ML',
  },
  {
    id: 'demo-vc-2',
    name: 'Michael Rodriguez',
    firm: 'NextGen Capital',
    role: 'Investment Director',
    focus: 'HealthTech, FinTech',
  },
  {
    id: 'demo-vc-3',
    name: 'Lisa Wang',
    firm: 'Innovation Partners',
    role: 'Managing Partner',
    focus: 'Climate Tech, Energy',
  },
];

// Demo startups for VCs to browse
export const demoVCStartups = [
  {
    id: 'demo-vc-startup-1',
    title: 'CloudSync Pro',
    name: 'CloudSync Pro',
    description: 'Enterprise file synchronization with military-grade encryption',
    stage: 'Series A',
    status: 'approved_for_vc',
    industry: 'B2B SaaS',
    targetMarket: 'Enterprise',
    fundingGoal: '$2M',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-vc-startup-2',
    title: 'FitnessPro AI',
    name: 'FitnessPro AI',
    description: 'AI-powered personalized fitness coaching and nutrition planning',
    stage: 'Seed',
    status: 'approved_for_vc',
    industry: 'HealthTech',
    targetMarket: 'Consumer',
    fundingGoal: '$500K',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-vc-startup-3',
    title: 'GreenCommute',
    name: 'GreenCommute',
    description: 'Electric vehicle fleet management for corporate sustainability',
    stage: 'MVP',
    status: 'approved_for_vc',
    industry: 'Climate Tech',
    targetMarket: 'B2B',
    fundingGoal: '$1.5M',
    created_at: new Date(Date.now() - 172800000).toISOString(),
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

export const demoVCMetrics = {
  availableStartups: 12,
  introRequestsSent: 3,
  approvedConnections: 1,
  pendingRequests: 2,
  rejectedRequests: 0,
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
  vc: {
    startup: 'This is a sample startup. Real startups will appear here once approved by admins.',
    requestIntro: 'In demo mode, you cannot request introductions. Browse real startups to connect.',
    flow: 'VC Flow: Discover approved startups → Request intro → Admin reviews → Connect with founder',
  },
  admin: {
    metrics: 'These are example metrics to show how the platform tracks performance.',
    approval: 'This shows how you review and approve founder submissions.',
  },
};
