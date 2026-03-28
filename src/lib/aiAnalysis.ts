// AI services - routes all calls through the backend API (OpenAI / ChatGPT)
import { apiClient, ChatResponse, IdeaResponse } from './api-client';
import {
  SafeAnalysisResult,
  fromLegacyResult,
} from './analysisValidator';

export type { SafeAnalysisResult } from './analysisValidator';
export { fromLegacyResult } from './analysisValidator';

export interface IdeaAnalysisRequest {
  title: string;
  description: string;
  targetMarket?: string | null;
}

/** @deprecated Use SafeAnalysisResult for new code. Kept for Supabase cache compat. */
export interface IdeaAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
}

export interface GeneratedIdea {
  title: string;
  description: string;
  targetMarket: string;
}



// ── Job-based async analysis ──────────────────────────────────────────────────

export interface StartAnalysisResult {
  jobId: string;
  /** "PENDING" = new job created; "EXISTING" = reusing an active job */
  status: 'PENDING' | 'EXISTING';
  message: string;
}

export interface JobStatusResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: IdeaAnalysisResult;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Start an async analysis job. Returns immediately with a jobId.
 * The OpenAI call runs on a backend background thread — independent of this connection.
 */
export async function startAnalysis(
  request: IdeaAnalysisRequest
): Promise<StartAnalysisResult> {
  const truncatedTitle = request.title?.substring(0, 100) || 'Untitled';
  const truncatedDescription = request.description?.substring(0, 10000) || '';
  const truncatedMarket = request.targetMarket?.substring(0, 200) || null;

  // 90s timeout: survives Render cold-starts (60–90s boot time) while still
  // failing fast if the server is genuinely unreachable.
  return apiClient.post<StartAnalysisResult>('/api/analysis/start', {
    title: truncatedTitle,
    description: truncatedDescription,
    targetMarket: truncatedMarket,
  }, 90000);
}

/**
 * Poll the status of a running analysis job.
 * Call every 2–3 seconds until status = COMPLETED or FAILED.
 */
export async function pollAnalysisStatus(jobId: string): Promise<JobStatusResult> {
  const raw = await apiClient.get<any>(`/api/analysis/status/${jobId}`);
  if (raw.result) {
    const r = raw.result;
    const rawScore = r.score;
    // Preserve all fields (legacy + new structured) — fromLegacyResult will detect the format
    raw.result = {
      score: rawScore != null ? Math.min(100, Math.max(0, rawScore)) : 0,
      strengths: r.strengths || [],
      weaknesses: r.weaknesses || [],
      recommendations: r.recommendations || [],
      // Legacy string fields (null for fresh results)
      marketSize: r.marketSize || r.market_size || undefined,
      competition: r.competition || undefined,
      viability: r.viability || 'Unknown',
      // New structured fields (present for fresh AI results)
      competitors: r.competitors || undefined,
      competitiveAdvantage: r.competitiveAdvantage || r.competitive_advantage || undefined,
      market: r.market || undefined,
      confidenceScore: r.confidenceScore || r.confidence_score || undefined,
      ideaSummary: r.ideaSummary || r.idea_summary || undefined,
      heuristicScores: r.heuristicScores || r.heuristic_scores || undefined,
      investorAnalysis: r.investorAnalysis || r.investor_analysis || undefined,
    };
  }
  return raw as JobStatusResult;
}

/**
 * Poll that returns the new SafeAnalysisResult with hallucination validation.
 * Wraps pollAnalysisStatus and runs the validator on completion.
 */
export interface SafeJobStatusResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  /** Validated & sanitised result — only present when status = COMPLETED */
  safeResult?: SafeAnalysisResult;
  /** Legacy result preserved for Supabase cache writes */
  legacyResult?: IdeaAnalysisResult;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export async function pollAnalysisStatusSafe(jobId: string): Promise<SafeJobStatusResult> {
  const raw = await pollAnalysisStatus(jobId);

  const base: SafeJobStatusResult = {
    jobId: raw.jobId,
    status: raw.status,
    errorMessage: raw.errorMessage,
    createdAt: raw.createdAt,
    completedAt: raw.completedAt,
  };

  if (raw.status === 'COMPLETED' && raw.result) {
    base.legacyResult = raw.result;

    // fromLegacyResult auto-detects new vs legacy format:
    // - New: has `competitors` array or `market` object → calls validateAndSanitise internally
    // - Old: has flat string fields (marketSize, competition) → uses legacy bridge
    base.safeResult = fromLegacyResult(raw.result);
  }

  return base;
}

// ── Job-based async pitch generation ─────────────────────────────────────────

export interface StartPitchResult {
  jobId: string;
  status: 'PENDING' | 'EXISTING';
  message: string;
}

export interface PitchSlide {
  title: string;
  content: string;
  bulletPoints: string[];
}

export interface PitchJobStatusResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: {
    slides: PitchSlide[];
    speakerNotes: string;
  };
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Start an async pitch generation job. Returns immediately with a jobId.
 * The OpenAI call runs on a backend background thread.
 */
export async function startPitch(request: {
  ideaName: string;
  problem: string;
  solution: string;
  audience?: string | null;
  market?: string | null;
  usp?: string | null;
}): Promise<StartPitchResult> {
  return apiClient.post<StartPitchResult>('/api/pitch/start', request, 90000);
}

/**
 * Poll the status of a running pitch generation job.
 * Call every 2–3 seconds until status = COMPLETED or FAILED.
 */
export async function pollPitchStatus(jobId: string): Promise<PitchJobStatusResult> {
  return apiClient.get<PitchJobStatusResult>(`/api/pitch/status/${jobId}`);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a startup idea via backend API (powered by OpenAI / ChatGPT)
 */
export async function generateIdea(): Promise<GeneratedIdea> {
  const response = await apiClient.post<IdeaResponse>('/api/ai/generate-idea', {}, 90000);
  return {
    title: response.title || '',
    description: response.description || '',
    targetMarket: response.targetMarket || '',
  };
}

/**
 * Improve a startup description via backend API (powered by OpenAI / ChatGPT)
 */
export async function improveDescription(description: string): Promise<string> {
  const response = await apiClient.post<ChatResponse>('/api/ai/improve-description', {
    description,
  }, 90000);
  return response.message?.trim() || description;
}
