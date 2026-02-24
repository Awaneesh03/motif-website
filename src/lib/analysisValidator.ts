// ─────────────────────────────────────────────────────────────────────────────
// analysisValidator.ts
//
// Type definitions and validation/bridge layer for analysis results.
//
// This file:
//   1. Defines the production-safe SafeAnalysisResult type.
//   2. Bridges legacy (flat string) and new (structured) backend responses.
//   3. Flags fields that contain suspicious fabricated data patterns.
// ─────────────────────────────────────────────────────────────────────────────

// ── Structured types ─────────────────────────────────────────────────────────

export interface Competitor {
  name: string;
  threat?: string;
  opportunity?: string;
}

export interface MarketAnalysis {
  market_size_category: 'Small' | 'Medium' | 'Large';
  market_reasoning: string;
  growth_potential: string;
  /** TAM estimate (prefix ~ signals AI estimate, e.g. "~$2B") */
  tam?: string;
  sam?: string;
  som?: string;
  growth_rate?: string;
  source_summary?: string;
}

export interface CompetitionAnalysis {
  competitors: Competitor[];
  competitive_advantage: string;
}

export interface ViabilityAnalysis {
  strengths: string[];
  risks: string[];
  overall_assessment: string;
}

/** The structured analysis the UI renders. */
export interface SafeAnalysisResult {
  /** Numeric viability score 0–100. */
  score: number;
  idea_summary: string;
  market_analysis: MarketAnalysis;
  competition_analysis: CompetitionAnalysis;
  viability_analysis: ViabilityAnalysis;
  /**
   * AI confidence in the quality of this analysis, 0–100.
   * Replaces the old 'Low'|'Medium'|'High' label.
   * 100 = full business detail provided. 0 = idea too vague to analyse.
   */
  confidence_score: number;
  confidence_reasoning: string;
  recommendations: string[];
  /** Fields that were flagged / rewritten by the validator. */
  _flags: string[];
}

// ── Legacy type (kept for Supabase cache compat) ─────────────────────────────

export interface LegacyAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
}

// ── Hallucination-detection heuristics ───────────────────────────────────────

const DOLLAR_AMOUNT_RE =
  /\$\s?\d[\d,.]*\s*(billion|trillion|million|B|T|M|bn|tn|mn)\b/gi;

const SPECIFIC_PERCENT_RE = /\b\d{2,}\.\d+%|\b\d{3,}%/g;

const CAGR_RE = /CAGR\s*(of\s*)?\d+(\.\d+)?%/gi;

const YEAR_REVENUE_RE =
  /\b(revenue|sales|GMV|ARR|MRR)\s+(of|was|reached|hit|exceeded)\s+\$[\d,.]+\s*(billion|trillion|million|B|T|M|bn|tn|mn)?\s*(in|by|during)\s+\d{4}\b/gi;

function containsSuspiciousData(text: string): boolean {
  return (
    DOLLAR_AMOUNT_RE.test(text) ||
    SPECIFIC_PERCENT_RE.test(text) ||
    CAGR_RE.test(text) ||
    YEAR_REVENUE_RE.test(text)
  );
}

function resetRegexes() {
  DOLLAR_AMOUNT_RE.lastIndex = 0;
  SPECIFIC_PERCENT_RE.lastIndex = 0;
  CAGR_RE.lastIndex = 0;
  YEAR_REVENUE_RE.lastIndex = 0;
}

function disclaimSuspiciousText(text: string, _fieldName: string): { text: string; flagged: boolean } {
  resetRegexes();
  if (containsSuspiciousData(text)) {
    resetRegexes();
    const disclaimer =
      ' [Note: Specific figures are estimates based on general industry patterns and should be independently verified.]';
    return { text: text + disclaimer, flagged: true };
  }
  return { text, flagged: false };
}

function sanitiseStringArray(
  items: unknown,
  fallback: string[],
  fieldName: string,
  flags: string[],
): string[] {
  if (!Array.isArray(items)) return fallback;
  return items.map((item, i) => {
    if (typeof item !== 'string') return fallback[0] || 'N/A';
    const { text, flagged } = disclaimSuspiciousText(item, `${fieldName}[${i}]`);
    if (flagged) flags.push(`${fieldName}[${i}]`);
    return text;
  });
}

// ── Normalisation helpers ─────────────────────────────────────────────────────

function normaliseMarketSize(raw: unknown): 'Small' | 'Medium' | 'Large' {
  if (typeof raw !== 'string') return 'Medium';
  const lower = raw.toLowerCase().trim();
  if (lower === 'large') return 'Large';
  if (lower === 'small') return 'Small';
  return 'Medium';
}

/** Maps old High/Medium/Low labels to numeric score if needed. */
function labelToNumericConfidence(label: string): number {
  const lower = label.toLowerCase().trim();
  if (lower === 'high') return 75;
  if (lower === 'low') return 25;
  return 50; // Medium
}

/** Clamp a numeric confidence score to [0, 100]. */
function clampConfidence(raw: unknown): number {
  if (typeof raw === 'number') return Math.max(0, Math.min(100, Math.round(raw)));
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return Math.max(0, Math.min(100, n));
    return labelToNumericConfidence(raw);
  }
  return 50;
}

// ── Old bracket-tag competitor parser (fallback for legacy cache) ─────────────

function parseLegacyCompetitors(text: string): Competitor[] {
  if (!text || !text.includes('[THREAT:')) return [];
  const results: Competitor[] = [];
  const parts = text.split(/\[THREAT:/i);
  for (let i = 1; i < parts.length; i++) {
    const prevChunk = parts[i - 1];
    const nameMatch = prevChunk.match(/(?:^|\.\s+)([^.[]+?)\s*$/);
    const name = nameMatch ? nameMatch[1].trim() : '';
    if (!name) continue;
    const current = parts[i];
    const edgeSplit = current.split(/\[EDGE:/i);
    const threat = edgeSplit[0].replace(/\]\s*$/, '').trim() || undefined;
    const opportunity =
      edgeSplit.length > 1 ? edgeSplit[1].replace(/\].*/, '').trim() || undefined : undefined;
    results.push({ name, threat, opportunity });
  }
  return results;
}

// ── New format: validator for fresh backend responses ─────────────────────────

/**
 * Converts a fresh backend AnalysisResponse (with structured competitors/market)
 * into SafeAnalysisResult.
 *
 * The backend now returns:
 *   competitors: [{name, threat, opportunity}]
 *   competitiveAdvantage: string
 *   market: {category, tam, sam, som, growth_rate, source_summary}
 *   confidenceScore: number
 *   viability: "Problem=x/20 ..."
 *   strengths/weaknesses/recommendations: string[]
 */
export function validateAndSanitise(raw: unknown): SafeAnalysisResult {
  const flags: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return insufficientResult('LLM returned non-object payload');
  }

  const obj = raw as Record<string, any>;

  // ── Score ──────────────────────────────────────────────────────────────────
  const rawScore = typeof obj.score === 'number' ? obj.score : 0;
  const score = Math.max(0, Math.min(100, rawScore));

  // ── Idea summary (derived from viability or overall) ──────────────────────
  const ideaSummary = typeof obj.idea_summary === 'string' && obj.idea_summary.trim()
    ? obj.idea_summary.trim()
    : typeof obj.viability === 'string' && obj.viability.trim()
    ? obj.viability.trim()
    : 'No summary provided.';

  if (ideaSummary.toLowerCase().includes('insufficient detail')) {
    return insufficientResult(ideaSummary);
  }

  // ── Market analysis ────────────────────────────────────────────────────────
  const ma = obj.market && typeof obj.market === 'object' ? obj.market : {};
  const marketReasoning = typeof ma.source_summary === 'string'
    ? ma.source_summary
    : 'Estimated based on general industry patterns.';
  const growthPotential = typeof ma.growth_rate === 'string'
    ? ma.growth_rate
    : 'Specific data unavailable without market research.';

  const { text: cleanedMarketReasoning, flagged: mrFlagged } =
    disclaimSuspiciousText(marketReasoning, 'market_reasoning');
  if (mrFlagged) flags.push('market_reasoning');

  // ── Competitors ────────────────────────────────────────────────────────────
  const rawCompetitors: Competitor[] = Array.isArray(obj.competitors)
    ? obj.competitors
        .filter((c: any) => c && typeof c.name === 'string' && c.name.trim())
        .map((c: any) => ({
          name: c.name.trim(),
          threat: typeof c.threat === 'string' ? c.threat.trim() : undefined,
          opportunity: typeof c.opportunity === 'string' ? c.opportunity.trim() : undefined,
        }))
    : [];

  // Deduplicate by name (case-insensitive)
  const seen = new Set<string>();
  const competitors = rawCompetitors.filter(c => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const competitiveAdvantage =
    typeof obj.competitive_advantage === 'string' && obj.competitive_advantage.trim()
      ? obj.competitive_advantage.trim()
      : 'No specific competitive advantage identified. Provide more detail about your differentiation.';

  // ── Viability analysis ─────────────────────────────────────────────────────
  const strengths = sanitiseStringArray(
    obj.strengths,
    ['Further analysis needed to identify specific strengths.'],
    'strengths',
    flags,
  );
  const risks = sanitiseStringArray(
    obj.weaknesses,
    ['Further analysis needed to identify specific risks.'],
    'weaknesses',
    flags,
  );
  const overallAssessment =
    typeof obj.viability === 'string' && obj.viability.trim()
      ? obj.viability.trim()
      : 'Insufficient data for a confident assessment.';

  const { text: cleanedOverall, flagged: oaFlagged } =
    disclaimSuspiciousText(overallAssessment, 'overall_assessment');
  if (oaFlagged) flags.push('overall_assessment');

  const recommendations = sanitiseStringArray(
    obj.recommendations,
    ['Provide a more detailed description for deeper analysis.'],
    'recommendations',
    flags,
  );

  // ── Confidence ─────────────────────────────────────────────────────────────
  const confidenceScore = clampConfidence(obj.confidence_score ?? obj.confidenceScore);
  const confidenceReasoning =
    typeof obj.confidence_reasoning === 'string'
      ? obj.confidence_reasoning
      : `Confidence score of ${confidenceScore}/100 assessed based on the level of detail provided.`;

  return {
    score,
    idea_summary: ideaSummary,
    market_analysis: {
      market_size_category: normaliseMarketSize(ma.category),
      market_reasoning: cleanedMarketReasoning,
      growth_potential: growthPotential,
      tam: typeof ma.tam === 'string' ? ma.tam : undefined,
      sam: typeof ma.sam === 'string' ? ma.sam : undefined,
      som: typeof ma.som === 'string' ? ma.som : undefined,
      growth_rate: typeof ma.growth_rate === 'string' ? ma.growth_rate : undefined,
      source_summary: typeof ma.source_summary === 'string' ? ma.source_summary : undefined,
    },
    competition_analysis: {
      competitors,
      competitive_advantage: competitiveAdvantage,
    },
    viability_analysis: {
      strengths,
      risks,
      overall_assessment: cleanedOverall,
    },
    confidence_score: confidenceScore,
    confidence_reasoning: confidenceReasoning,
    recommendations,
    _flags: flags,
  };
}

// ── Legacy bridge ─────────────────────────────────────────────────────────────

/**
 * Converts a legacy flat result (from Supabase cache or old backend format)
 * OR a new structured backend result (with competitors/market fields) into
 * SafeAnalysisResult so the UI can render it uniformly.
 *
 * Detection order:
 *  1. Has `competitors` array  → new structured format
 *  2. Has `market` object      → new structured format
 *  3. Otherwise                → old flat string format
 */
export function fromLegacyResult(legacy: LegacyAnalysisResult | Record<string, any>): SafeAnalysisResult {
  // ── New structured format from fresh backend response ──────────────────────
  if (
    Array.isArray((legacy as any).competitors) ||
    ((legacy as any).market && typeof (legacy as any).market === 'object')
  ) {
    return validateAndSanitise(legacy);
  }

  // ── Old flat format ────────────────────────────────────────────────────────
  const flags: string[] = ['legacy_format'];
  const old = legacy as LegacyAnalysisResult;
  const score = typeof old.score === 'number' ? Math.max(0, Math.min(100, old.score)) : 0;

  // Try to parse bracket-tag competitors from old competition string
  const legacyCompetitors = parseLegacyCompetitors(old.competition || '');

  // Fallback: wrap raw string as single competitor entry
  const competitors: Competitor[] =
    legacyCompetitors.length > 0
      ? legacyCompetitors
      : old.competition && old.competition.trim()
      ? [{ name: old.competition.trim() }]
      : [];

  return {
    score,
    idea_summary: 'Analysis imported from previous format.',
    market_analysis: {
      market_size_category: guessMarketCategory(old.marketSize),
      market_reasoning: old.marketSize || 'Estimated based on general industry patterns.',
      growth_potential: 'Specific data unavailable without market research.',
    },
    competition_analysis: {
      competitors,
      competitive_advantage: 'Re-run the analysis to see updated competitive advantages.',
    },
    viability_analysis: {
      strengths: old.strengths?.length ? old.strengths : ['No specific strengths identified.'],
      risks: old.weaknesses?.length ? old.weaknesses : ['No specific risks identified.'],
      overall_assessment: old.viability || 'No viability assessment available.',
    },
    confidence_score: 50,
    confidence_reasoning: 'Converted from legacy analysis format — confidence may be approximate.',
    recommendations: old.recommendations?.length
      ? old.recommendations
      : ['Re-run the analysis with the updated AI for a more detailed report.'],
    _flags: flags,
  };
}

/** Heuristic: bucket a free-text market-size string into a size category. */
function guessMarketCategory(text: string): 'Small' | 'Medium' | 'Large' {
  if (!text) return 'Medium';
  const lower = text.toLowerCase();
  if (lower.includes('large') || lower.includes('billion') || lower.includes('massive') || lower.includes('huge'))
    return 'Large';
  if (lower.includes('small') || lower.includes('niche') || lower.includes('narrow'))
    return 'Small';
  return 'Medium';
}

/**
 * Returns a safe "insufficient data" result used when input was too vague
 * or the response failed validation entirely.
 */
function insufficientResult(reason: string): SafeAnalysisResult {
  return {
    score: 0,
    idea_summary: reason,
    market_analysis: {
      market_size_category: 'Medium',
      market_reasoning: 'Insufficient detail to generate accurate analysis.',
      growth_potential: 'Insufficient detail to generate accurate analysis.',
    },
    competition_analysis: {
      competitors: [],
      competitive_advantage: 'Insufficient detail to generate accurate analysis.',
    },
    viability_analysis: {
      strengths: ['Insufficient detail to generate accurate analysis.'],
      risks: ['Insufficient detail to generate accurate analysis.'],
      overall_assessment: 'Insufficient detail to generate accurate analysis.',
    },
    confidence_score: 0,
    confidence_reasoning: reason,
    recommendations: ['Provide a more detailed description of the idea and its target market.'],
    _flags: ['insufficient_input'],
  };
}
