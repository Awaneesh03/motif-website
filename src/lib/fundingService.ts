import { apiClient } from './api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FundingQualificationData {
  fullName: string;
  email: string;
  experienceLevel: string;
  linkedinUrl: string;
  previousStartups: string;
}

export interface FundingQualificationResponse {
  /** true = existing row found; fields are populated. false = first-time user; fields absent. */
  found: boolean;
  fullName?: string;
  email?: string;
  experienceLevel?: string;
  linkedinUrl?: string;
  previousStartups?: string;
  updatedAt?: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetch the caller's saved qualification profile.
 * Returns { found: true, ...fields } for returning users.
 * Returns { found: false } for first-time users.
 */
const FUNDING_TIMEOUT_MS = 9_000; // 9 s — short enough to show retry quickly

export async function getQualification(): Promise<FundingQualificationResponse> {
  return apiClient.get<FundingQualificationResponse>('/api/funding/qualification', FUNDING_TIMEOUT_MS);
}

/**
 * Upsert the caller's qualification profile.
 * Safe to call repeatedly — no duplicate rows are created.
 */
export async function saveQualification(
  data: FundingQualificationData
): Promise<FundingQualificationResponse> {
  return apiClient.post<FundingQualificationResponse>('/api/funding/qualification', data, FUNDING_TIMEOUT_MS);
}
