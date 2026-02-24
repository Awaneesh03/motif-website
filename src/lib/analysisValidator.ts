// ─────────────────────────────────────────────────────────────────────────────
// analysisValidator.ts
//
// Backend-in-the-browser validation layer that catches suspicious LLM output
// BEFORE it is displayed to the user.
//
// This file:
//   1. Defines the production-safe AnalysisResult type.
//   2. Validates + sanitises raw LLM JSON against hallucination heuristics.
//   3. Flags or rewrites fields that look fabricated.
// ─────────────────────────────────────────────────────────────────────────────

// ── New structured types ────────────────────────────────────────────────────

export interface MarketAnalysis {
  market_size_category: 'Small' | 'Medium' | 'Large';
  market_reasoning: string;
  growth_potential: string;
}

export interface CompetitionAnalysis {
  direct_competition_type: string;
  indirect_competition_type: string;
  competitive_advantage_needed: string;
}

export interface ViabilityAnalysis {
  strengths: string[];
  risks: string[];
  overall_assessment: string;
}

export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

/** The structured analysis the UI renders. */
export interface SafeAnalysisResult {
  idea_summary: string;
  market_analysis: MarketAnalysis;
  competition_analysis: CompetitionAnalysis;
  viability_analysis: ViabilityAnalysis;
  confidence_level: ConfidenceLevel;
  confidence_reasoning: string;
  recommendations: string[];
  /** Fields that were flagged / rewritten by the validator. */
  _flags: string[];
}

// ── Legacy type (kept for Supabase cache compat) ────────────────────────────

export interface LegacyAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: string;
  competition: string;
  viability: string;
}

// ── Hallucination-detection heuristics ──────────────────────────────────────

/**
 * Matches dollar amounts like "$4.5B", "$120 million", "$3.2 trillion", "$500M"
 * Uses word boundaries so embedded strings don't match.
 */
const DOLLAR_AMOUNT_RE =
  /\$\s?\d[\d,.]*\s*(billion|trillion|million|B|T|M|bn|tn|mn)\b/gi;

/**
 * Matches percentage figures with > 2 significant digits, e.g. "23.7%", "142%".
 * Simple "10%" or "5%" are borderline acceptable; we flag anything specific.
 */
const SPECIFIC_PERCENT_RE = /\b\d{2,}\.\d+%|\b\d{3,}%/g;

/**
 * Matches "CAGR of X%", "growing at X%" patterns — these almost always come
 * from training data hallucination, not real knowledge.
 */
const CAGR_RE = /CAGR\s*(of\s*)?\d+(\.\d+)?%/gi;

/**
 * Year-specific revenue claims: "revenue of $X in 2024"
 */
const YEAR_REVENUE_RE =
  /\b(revenue|sales|GMV|ARR|MRR)\s+(of|was|reached|hit|exceeded)\s+\$[\d,.]+\s*(billion|trillion|million|B|T|M|bn|tn|mn)?\s*(in|by|during)\s+\d{4}\b/gi;

/**
 * Returns true if the string contains suspicious fabricated data patterns.
 */
function containsSuspiciousData(text: string): boolean {
  return (
    DOLLAR_AMOUNT_RE.test(text) ||
    SPECIFIC_PERCENT_RE.test(text) ||
    CAGR_RE.test(text) ||
    YEAR_REVENUE_RE.test(text)
  );
}

// Reset lastIndex for global regexes (they are stateful)
function resetRegexes() {
  DOLLAR_AMOUNT_RE.lastIndex = 0;
  SPECIFIC_PERCENT_RE.lastIndex = 0;
  CAGR_RE.lastIndex = 0;
  YEAR_REVENUE_RE.lastIndex = 0;
}

/**
 * Appends a disclaimer to text containing suspicious numeric claims.
 */
function disclaimSuspiciousText(text: string, fieldName: string): { text: string; flagged: boolean } {
  resetRegexes();
  if (containsSuspiciousData(text)) {
    resetRegexes();
    const disclaimer = ' [Note: Specific figures are estimated based on general industry patterns and should be independently verified.]';
    return { text: text + disclaimer, flagged: true };
  }
  return { text, flagged: false };
}

/**
 * Sanitise a string array (strengths / risks / recommendations).
 * Flags individual items that look fabricated.
 */
function sanitiseStringArray(
  items: unknown,
  fallback: string[],
  fieldName: string,
  flags: string[],
): string[] {
  if (!Array.isArray(items)) return fallback;
  return items.map((item, i) => {
    if (typeof item !== 'string') return `${fallback[0] || 'N/A'}`;
    const { text, flagged } = disclaimSuspiciousText(item, `${fieldName}[${i}]`);
    if (flagged) flags.push(`${fieldName}[${i}]`);
    return text;
  });
}

// ── Normalise confidence_level ──────────────────────────────────────────────

function normaliseConfidence(raw: unknown): ConfidenceLevel {
  if (typeof raw !== 'string') return 'Medium';
  const lower = raw.toLowerCase().trim();
  if (lower === 'high') return 'High';
  if (lower === 'low') return 'Low';
  return 'Medium';
}

// ── Normalise market size category ──────────────────────────────────────────

function normaliseMarketSize(raw: unknown): 'Small' | 'Medium' | 'Large' {
  if (typeof raw !== 'string') return 'Medium';
  const lower = raw.toLowerCase().trim();
  if (lower === 'large') return 'Large';
  if (lower === 'small') return 'Small';
  return 'Medium';
}

// ── Main validator ──────────────────────────────────────────────────────────

/**
 * Validates and sanitises raw JSON from the LLM.
 *
 * - Rejects structurally invalid payloads (returns a "failed" result).
 * - Flags fields that contain suspicious fabricated numbers.
 * - Normalises enum values.
 */
export function validateAndSanitise(raw: unknown): SafeAnalysisResult {
  const flags: string[] = [];

  // ── Basic structural check ────────────────────────────────────────────
  if (!raw || typeof raw !== 'object') {
    return insufficientResult('LLM returned non-object payload');
  }

  const obj = raw as Record<string, any>;

  // ── Idea summary ──────────────────────────────────────────────────────
  const ideaSummary =
    typeof obj.idea_summary === 'string' && obj.idea_summary.trim()
      ? obj.idea_summary.trim()
      : 'No summary provided.';

  // Short-circuit: if the model said "insufficient detail"
  if (ideaSummary.toLowerCase().includes('insufficient detail')) {
    return insufficientResult(ideaSummary);
  }

  // ── Market analysis ───────────────────────────────────────────────────
  const ma = obj.market_analysis && typeof obj.market_analysis === 'object'
    ? obj.market_analysis
    : {};

  const marketReasoning = typeof ma.market_reasoning === 'string' ? ma.market_reasoning : 'Estimated based on general industry patterns';
  const growthPotential = typeof ma.growth_potential === 'string' ? ma.growth_potential : 'Specific data unavailable without market research';

  const { text: cleanedMarketReasoning, flagged: mrFlagged } = disclaimSuspiciousText(marketReasoning, 'market_reasoning');
  const { text: cleanedGrowthPotential, flagged: gpFlagged } = disclaimSuspiciousText(growthPotential, 'growth_potential');
  if (mrFlagged) flags.push('market_reasoning');
  if (gpFlagged) flags.push('growth_potential');

  // ── Competition analysis ──────────────────────────────────────────────
  const ca = obj.competition_analysis && typeof obj.competition_analysis === 'object'
    ? obj.competition_analysis
    : {};

  const directComp = typeof ca.direct_competition_type === 'string' ? ca.direct_competition_type : 'Specific data unavailable without market research';
  const indirectComp = typeof ca.indirect_competition_type === 'string' ? ca.indirect_competition_type : 'Specific data unavailable without market research';
  const compAdvantage = typeof ca.competitive_advantage_needed === 'string' ? ca.competitive_advantage_needed : 'Differentiation needed; further research required.';

  // ── Viability analysis ────────────────────────────────────────────────
  const va = obj.viability_analysis && typeof obj.viability_analysis === 'object'
    ? obj.viability_analysis
    : {};

  const strengths = sanitiseStringArray(
    va.strengths,
    ['Further analysis needed to identify specific strengths.'],
    'strengths',
    flags,
  );
  const risks = sanitiseStringArray(
    va.risks,
    ['Further analysis needed to identify specific risks.'],
    'risks',
    flags,
  );
  const overallAssessment =
    typeof va.overall_assessment === 'string'
      ? va.overall_assessment
      : 'Insufficient data for a confident assessment. Consider providing a more detailed description.';

  const { text: cleanedOverall, flagged: oaFlagged } = disclaimSuspiciousText(overallAssessment, 'overall_assessment');
  if (oaFlagged) flags.push('overall_assessment');

  // ── Confidence & recommendations ──────────────────────────────────────
  const confidenceReasoning =
    typeof obj.confidence_reasoning === 'string'
      ? obj.confidence_reasoning
      : 'Confidence assessed based on the level of detail provided.';

  const recommendations = sanitiseStringArray(
    obj.recommendations,
    ['Provide a more detailed description for deeper analysis.'],
    'recommendations',
    flags,
  );

  return {
    idea_summary: ideaSummary,
    market_analysis: {
      market_size_category: normaliseMarketSize(ma.market_size_category),
      market_reasoning: cleanedMarketReasoning,
      growth_potential: cleanedGrowthPotential,
    },
    competition_analysis: {
      direct_competition_type: directComp,
      indirect_competition_type: indirectComp,
      competitive_advantage_needed: compAdvantage,
    },
    viability_analysis: {
      strengths,
      risks,
      overall_assessment: cleanedOverall,
    },
    confidence_level: normaliseConfidence(obj.confidence_level),
    confidence_reasoning: confidenceReasoning,
    recommendations,
    _flags: flags,
  };
}

/**
 * Returns a safe "insufficient data" result used when LLM input was
 * too vague or the response failed validation entirely.
 */
function insufficientResult(reason: string): SafeAnalysisResult {
  return {
    idea_summary: reason,
    market_analysis: {
      market_size_category: 'Medium',
      market_reasoning: 'Insufficient detail to generate accurate analysis.',
      growth_potential: 'Insufficient detail to generate accurate analysis.',
    },
    competition_analysis: {
      direct_competition_type: 'Insufficient detail to generate accurate analysis.',
      indirect_competition_type: 'Insufficient detail to generate accurate analysis.',
      competitive_advantage_needed: 'Insufficient detail to generate accurate analysis.',
    },
    viability_analysis: {
      strengths: ['Insufficient detail to generate accurate analysis.'],
      risks: ['Insufficient detail to generate accurate analysis.'],
      overall_assessment: 'Insufficient detail to generate accurate analysis.',
    },
    confidence_level: 'Low',
    confidence_reasoning: reason,
    recommendations: ['Provide a more detailed description of the idea and its target market.'],
    _flags: ['insufficient_input'],
  };
}

// ── Legacy bridge ───────────────────────────────────────────────────────────

/**
 * Converts a legacy flat result (from Supabase cache or old backend)
 * into the new SafeAnalysisResult shape so the UI can render it uniformly.
 */
export function fromLegacyResult(legacy: LegacyAnalysisResult): SafeAnalysisResult {
  const flags: string[] = ['legacy_format'];

  return {
    idea_summary: 'Analysis imported from previous format.',
    market_analysis: {
      market_size_category: guessMarketCategory(legacy.marketSize),
      market_reasoning: legacy.marketSize || 'Estimated based on general industry patterns',
      growth_potential: 'Specific data unavailable without market research',
    },
    competition_analysis: {
      direct_competition_type: legacy.competition || 'Specific data unavailable without market research',
      indirect_competition_type: 'Specific data unavailable without market research',
      competitive_advantage_needed: 'Further research recommended.',
    },
    viability_analysis: {
      strengths: legacy.strengths?.length ? legacy.strengths : ['No specific strengths identified.'],
      risks: legacy.weaknesses?.length ? legacy.weaknesses : ['No specific risks identified.'],
      overall_assessment: legacy.viability || 'No viability assessment available.',
    },
    confidence_level: 'Medium',
    confidence_reasoning: 'Converted from legacy analysis format — confidence may be approximate.',
    recommendations: legacy.recommendations?.length
      ? legacy.recommendations
      : ['Re-run the analysis with the updated AI for a more detailed report.'],
    _flags: flags,
  };
}

/** Heuristic: try to bucket a free-text market-size string into a category. */
function guessMarketCategory(text: string): 'Small' | 'Medium' | 'Large' {
  if (!text) return 'Medium';
  const lower = text.toLowerCase();
  if (lower.includes('large') || lower.includes('billion') || lower.includes('massive') || lower.includes('huge'))
    return 'Large';
  if (lower.includes('small') || lower.includes('niche') || lower.includes('narrow'))
    return 'Small';
  return 'Medium';
}
