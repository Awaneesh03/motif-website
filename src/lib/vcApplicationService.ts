import { apiClient } from './api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'interested'
  | 'rejected'
  | 'funded'
  // legacy VC intro-request statuses (read-only from existing rows)
  | 'pending'
  | 'accepted';

export interface HistoryEntry {
  oldStatus: string | null;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

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
  history?: HistoryEntry[];
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
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
  funded:       'Funded',
  pending:      'Pending',
  accepted:     'Accepted',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  interested:   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  funded:       'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  pending:      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  accepted:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

/** Ordered steps for the status timeline shown to founders. */
export const STATUS_TIMELINE: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'interested',
  'funded',
];

/** Valid transitions — mirrors backend ApplicationStatus enum. */
export const VALID_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  submitted:    ['under_review'],
  under_review: ['interested', 'rejected'],
  interested:   ['funded', 'rejected'],
  rejected:     [],
  funded:       [],
};

export function canTransitionTo(current: ApplicationStatus, next: ApplicationStatus): boolean {
  const allowed = VALID_TRANSITIONS[current] ?? [];
  return allowed.includes(next);
}

// ── API calls ─────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 10_000;

export interface GetApplicationsParams {
  page?: number;
  size?: number;
  status?: string;
}

/** Founder: fetch own applications, paginated. */
export async function getMyApplications(
  params: GetApplicationsParams = {},
): Promise<PagedResponse<VcApplicationResponse>> {
  const { page = 0, size = 10 } = params;
  return apiClient.get<PagedResponse<VcApplicationResponse>>(
    `/api/funding/my-applications?page=${page}&size=${size}`,
    TIMEOUT_MS,
  );
}

/** VC/admin: fetch all applications, paginated + optional status filter. */
export async function getAllApplications(
  params: GetApplicationsParams = {},
): Promise<PagedResponse<VcApplicationResponse>> {
  const { page = 0, size = 10, status } = params;
  const statusQ = status ? `&status=${encodeURIComponent(status)}` : '';
  return apiClient.get<PagedResponse<VcApplicationResponse>>(
    `/api/vc/applications?page=${page}&size=${size}${statusQ}`,
    TIMEOUT_MS,
  );
}

/** VC/admin: update an application's status and/or notes. */
export async function updateApplicationStatus(
  id: string,
  req: UpdateStatusRequest,
): Promise<VcApplicationResponse> {
  return apiClient.put<VcApplicationResponse>(`/api/vc/applications/${id}/status`, req);
}
