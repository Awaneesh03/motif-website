import { apiClient } from './api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'interested'
  | 'rejected'
  // legacy VC intro-request statuses (read-only from existing rows)
  | 'pending'
  | 'accepted';

export interface VcApplicationResponse {
  id: string;
  vcId: string | null;
  founderId: string | null;
  ideaId: string | null;
  ideaTitle: string | null;
  status: ApplicationStatus;
  vcNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStatusRequest {
  status: ApplicationStatus;
  vcNotes?: string;
}

// ── Status display helpers ─────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  interested:   'Interested',
  rejected:     'Rejected',
  pending:      'Pending',
  accepted:     'Accepted',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  interested:   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  pending:      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  accepted:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

/** Ordered steps for the status timeline shown to founders. */
export const STATUS_TIMELINE: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'interested',
];

// ── API calls ─────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 10_000;

/** Founder: fetch own applications. */
export async function getMyApplications(): Promise<VcApplicationResponse[]> {
  return apiClient.get<VcApplicationResponse[]>('/api/funding/my-applications', TIMEOUT_MS);
}

/** VC/admin: fetch all applications, optionally filtered by status. */
export async function getAllApplications(status?: string): Promise<VcApplicationResponse[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient.get<VcApplicationResponse[]>(`/api/vc/applications${query}`, TIMEOUT_MS);
}

/** VC/admin: update an application's status and/or notes. */
export async function updateApplicationStatus(
  id: string,
  req: UpdateStatusRequest,
): Promise<VcApplicationResponse> {
  return apiClient.put<VcApplicationResponse>(`/api/vc/applications/${id}/status`, req);
}
