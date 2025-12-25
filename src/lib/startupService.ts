// Simple localStorage-based service for managing startups
// This simulates a backend API for the skeleton flow

export type StartupStatus = 'pending' | 'approved_for_vc' | 'rejected';

export interface Startup {
  id: string;
  name: string;
  pitch: string;
  problem: string;
  solution: string;
  industry: string;
  stage: string;
  status: StartupStatus;
  createdBy: string; // founder user id
  founderName: string;
  createdAt: string;
}

const STORAGE_KEY = 'motif_startups';

// Initialize with mock data if empty
const initializeStartups = (): Startup[] => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return JSON.parse(existing);
  }

  // Initial mock startups
  const mockStartups: Startup[] = [
    {
      id: '1',
      name: 'CloudSync Pro',
      pitch: 'AI-powered cloud storage optimization for enterprises',
      problem: 'Enterprises waste 40% of cloud storage costs on duplicate and unused data.',
      solution: 'Machine learning platform that automatically optimizes cloud storage in real-time.',
      industry: 'SaaS',
      stage: 'Seed',
      status: 'pending',
      createdBy: 'mock-founder-1',
      founderName: 'Sarah Chen',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'HealthTrack AI',
      pitch: 'Personalized health monitoring using machine learning',
      problem: 'Current health apps lack personalization and actionable insights.',
      solution: 'AI-powered health tracker that provides personalized recommendations.',
      industry: 'HealthTech',
      stage: 'Pre-seed',
      status: 'pending',
      createdBy: 'mock-founder-2',
      founderName: 'Mike Johnson',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'FinFlow',
      pitch: 'Automated cash flow management for SMBs',
      problem: 'Small businesses struggle with manual cash flow tracking.',
      solution: 'Automated platform that predicts and optimizes cash flow.',
      industry: 'FinTech',
      stage: 'Seed',
      status: 'approved_for_vc',
      createdBy: 'mock-founder-3',
      founderName: 'Emily Rodriguez',
      createdAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockStartups));
  return mockStartups;
};

// Get all startups
export const getAllStartups = (): Startup[] => {
  return initializeStartups();
};

// Get startups by founder
export const getStartupsByFounder = (founderId: string): Startup[] => {
  const startups = getAllStartups();
  return startups.filter((s) => s.createdBy === founderId);
};

// Get approved startups (for VCs)
export const getApprovedStartups = (): Startup[] => {
  const startups = getAllStartups();
  return startups.filter((s) => s.status === 'approved_for_vc');
};

// Create new startup
export const createStartup = (
  startup: Omit<Startup, 'id' | 'createdAt'>
): Startup => {
  const startups = getAllStartups();
  const newStartup: Startup = {
    ...startup,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  startups.push(newStartup);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(startups));
  return newStartup;
};

// Update startup status (admin only)
export const updateStartupStatus = (
  id: string,
  status: StartupStatus
): Startup | null => {
  const startups = getAllStartups();
  const index = startups.findIndex((s) => s.id === id);
  if (index === -1) return null;

  startups[index].status = status;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(startups));
  return startups[index];
};

// Get single startup
export const getStartupById = (id: string): Startup | null => {
  const startups = getAllStartups();
  return startups.find((s) => s.id === id) || null;
};
