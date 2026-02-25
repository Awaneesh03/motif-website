// AI services - routes all calls through the backend API (OpenAI / ChatGPT)
import { apiClient, AnalysisResponse, ChatResponse, IdeaResponse } from './api-client';
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

  return apiClient.post<StartAnalysisResult>('/api/analysis/start', {
    title: truncatedTitle,
    description: truncatedDescription,
    targetMarket: truncatedMarket,
  });
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

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze a startup idea via backend API (powered by OpenAI / ChatGPT)
 */
export async function analyzeIdea(
  request: IdeaAnalysisRequest
): Promise<IdeaAnalysisResult> {
  console.log('[IdeaAnalysis] Starting analysis for:', request.title);
  try {
    console.log('[IdeaAnalysis] Calling backend API (OpenAI, long timeout)...');

    // Truncate to match backend validation limits
    const truncatedTitle = request.title?.substring(0, 100) || 'Untitled';
    const truncatedDescription = request.description?.substring(0, 10000) || '';
    const truncatedMarket = request.targetMarket?.substring(0, 200) || null;

    console.log('[IdeaAnalysis] Title length:', truncatedTitle.length, 'Desc length:', truncatedDescription.length);

    const response = await apiClient.postLong<AnalysisResponse>('/api/ai/analyze-idea', {
      title: truncatedTitle,
      description: truncatedDescription,
      targetMarket: truncatedMarket,
    });
    console.log('[IdeaAnalysis] Backend response received:', response);

    return {
      score: response.score ?? 70,
      strengths: response.strengths || [],
      weaknesses: response.weaknesses || [],
      recommendations: response.recommendations || [],
      marketSize: response.marketSize || 'Unknown',
      competition: response.competition || 'Unknown',
      viability: response.viability || 'Medium Viability',
    };
  } catch (error) {
    console.error('[IdeaAnalysis] Error occurred:', error);
    const raw = error instanceof Error ? error.message : 'Backend analysis failed';
    // Give a friendlier message for cold-start / network failures
    let errorMessage = raw;
    if (raw.includes('timed out') || raw.includes('Failed to fetch')) {
      errorMessage =
        'The server is waking up after inactivity (this can take 1–2 minutes). Please wait a moment and try again.';
    }
    console.error('[IdeaAnalysis] Throwing error to user:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Generate a startup idea via backend API (powered by OpenAI / ChatGPT)
 */
export async function generateIdea(): Promise<GeneratedIdea> {
  const response = await apiClient.post<IdeaResponse>('/api/ai/generate-idea', {});
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
  });
  return response.message?.trim() || description;
}
