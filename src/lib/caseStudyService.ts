/**
 * Case Study Service
 *
 * Single source of truth for all case study data fetching.
 * No component should call supabase.from('case_studies') directly.
 *
 * Attempt counts come from the denormalized `attempts` column on
 * `case_studies`, kept in sync with user_activity(type='case_completed')
 * by a DB trigger / backend worker.
 *
 * Concurrency guarantees
 * ──────────────────────
 * • Request deduplication   — concurrent callers share one in-flight promise;
 *   the DB is never hit twice for the same data.
 * • Stale-while-revalidate  — an expired cache is served immediately while a
 *   background refresh runs, so the UI never shows a loading spinner for
 *   returning visitors.
 * • Cache versioning         — `invalidateCaseStudyCache()` increments a
 *   version counter.  Any fetch that started before the invalidation checks
 *   the counter on completion and discards its result rather than overwriting
 *   a newer cache entry with older data.
 * • Cache-only limit         — `fetchCaseStudies(n)` slices the in-memory
 *   cache; it never issues a DB-level LIMIT query.  One round-trip warms the
 *   cache for every caller regardless of the requested limit.
 * • Reactive subscriptions   — components can subscribe to cache updates via
 *   `subscribeToCaseStudies`.  Notifications fire synchronously after each
 *   successful cache write so listeners always see data that is already in
 *   the cache.  Using a Set prevents duplicate registrations.
 */

import { supabase, getCaseStudyImageUrl } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types — public
// ─────────────────────────────────────────────────────────────────────────────

export type CaseDifficulty = 'Easy' | 'Medium' | 'Hard';

/** Canonical list-card shape used by CaseCard, HomePage, CaseStudiesPage. */
export interface CaseStudy {
  id: string;
  company: string;
  /** Fully resolved public URL, or null when unavailable. */
  logo: string | null;
  title: string;
  description: string;
  difficulty: CaseDifficulty;
  category: string;
  attempts: number;
}

/** Full shape used by CaseDetailPage — strict superset of CaseStudy. */
export interface CaseStudyDetail extends CaseStudy {
  background: string;
  problem: string;
  constraints: string;
  expectedOutcome: string;
  hints: string[];
  publishedDate: string;
}

export interface FetchCaseStudiesResult {
  data: CaseStudy[];
  error: string | null;
}

export interface FetchCaseStudyDetailResult {
  data: CaseStudyDetail | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types — raw DB rows (private)
//
// Mirror the exact column names in our SELECT statements.
// A column rename in the DB produces a TypeScript error here rather than a
// silent `undefined` field reaching the UI.
// ─────────────────────────────────────────────────────────────────────────────

interface CaseStudyListRow {
  id: string;
  title: string | null;
  company: string | null;
  image_url: string | null;
  problem_statement: string | null;
  difficulty: string | null;
  category: string | null;
  attempts: number | null;
  tags: unknown; // jsonb — may be array, string, or null
}

interface CaseStudyDetailRow extends CaseStudyListRow {
  background: string | null;
  constraints: string | null;
  expected_outcome: string | null;
  hints: unknown; // jsonb — array, comma-string, or null
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────────────────

interface CaseStudyCache {
  data: CaseStudy[];
  fetchedAt: number;
}

/**
 * Data younger than this is "fresh" — no revalidation triggered.
 * Data older than this but present is "stale" — served immediately while a
 * background revalidation runs (stale-while-revalidate).
 */
const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

/**
 * Warn when the cache grows beyond this many rows.
 * Case-study tables are typically small; a sudden spike suggests a migration
 * error or runaway seed script and warrants investigation before it
 * becomes a memory concern.
 */
const CACHE_SIZE_WARN_THRESHOLD = 500;

let _fullCache: CaseStudyCache | null = null;

/**
 * Incremented on every `invalidateCaseStudyCache()` call.
 *
 * Every fetch captures this value at start time.  Before writing to the
 * cache on completion, the fetch checks whether the counter still matches.
 * A mismatch means an invalidation (or a newer fetch) occurred while this
 * fetch was in-flight; the result is discarded rather than overwriting a
 * more up-to-date cache entry with stale data.
 */
let _cacheVersion = 0;

/**
 * In-flight fetch promise shared across concurrent callers.
 * Cleared on settle (success or failure) so a failing fetch is retried on
 * the next call rather than replaying a cached rejection.
 */
let _pendingFull: Promise<CaseStudy[]> | null = null;

type CacheState = 'fresh' | 'stale' | 'empty';

function getCacheState(): CacheState {
  if (!_fullCache) return 'empty';
  if (Date.now() - _fullCache.fetchedAt < CACHE_TTL_MS) return 'fresh';
  return 'stale';
}

/**
 * Bust the full-list cache.
 *
 * Three things happen atomically:
 *  1. `_cacheVersion` is incremented — any fetch currently in-flight will
 *     see a version mismatch on completion and discard its result, preventing
 *     a slow background fetch from overwriting a newer cache entry.
 *  2. `_fullCache` is cleared — no stale data is served after this point.
 *  3. `_pendingFull` is cleared — new callers start a fresh fetch rather than
 *     joining the old in-flight request (which may predate the admin's change).
 *     Callers already awaiting the old promise still receive its result, but
 *     that result is not written to the cache (version mismatch guard).
 *
 * Call this after any admin write (create / update / delete).
 */
export function invalidateCaseStudyCache(): void {
  _cacheVersion++;
  _fullCache = null;
  _pendingFull = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscriptions
//
// A lightweight pub/sub layer that lets components receive cache updates
// without re-issuing a fetch.  The mechanism is intentionally minimal:
//
//  • Set<fn>   — natural deduplication; registering the same function
//                reference twice (e.g. React Strict Mode double-invoke) is
//                a no-op rather than a double-notification.
//  • Frozen snapshot — listeners receive a new immutable array each time,
//                not a reference into _fullCache, so they cannot accidentally
//                corrupt the shared cache.
//  • Error isolation — one listener throwing cannot prevent others from
//                receiving the same update.
//  • Synchronous dispatch — notifyListeners() is called inside fetchFromDB()
//                after the cache is written but before the function returns.
//                A listener that calls fetchCaseStudies() synchronously will
//                therefore always get a cache hit, never trigger a new fetch.
//
// Flicker guarantee
// ─────────────────
// Notifications never carry an empty or partial payload — they only fire
// when a complete, valid dataset has been committed to _fullCache.  Combined
// with React 18's automatic batching, a component that both awaits the
// initial fetch and subscribes will batch all resulting setState calls into
// a single render: loading → loaded (no intermediate empty frame).
// ─────────────────────────────────────────────────────────────────────────────

/** Callback signature received by all cache update subscribers. */
export type CacheUpdateListener = (data: ReadonlyArray<CaseStudy>) => void;

/**
 * Active subscribers.  Set semantics ensure each function reference is
 * stored at most once regardless of how many times it is registered.
 */
const _listeners = new Set<CacheUpdateListener>();

/**
 * Subscribe to cache updates.
 *
 * The listener is called after every successful cache write — both the
 * initial foreground fetch (empty → fresh) and subsequent background
 * revalidations (stale → fresh).  It receives a frozen snapshot of the
 * complete case study list; apply `.slice(0, n)` locally if you only
 * need a subset.
 *
 * Returns an unsubscribe function.  Always call it in `useEffect` cleanup
 * to prevent memory leaks and stale-closure writes to unmounted components.
 *
 * @example
 * useEffect(() => {
 *   const unsubscribe = subscribeToCaseStudies((fresh) => {
 *     if (!cancelled) setCaseStudies([...fresh]);
 *   });
 *   return unsubscribe;
 * }, []);
 */
export function subscribeToCaseStudies(listener: CacheUpdateListener): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

/**
 * Dispatch the updated dataset to all active listeners.
 *
 * Called synchronously inside fetchFromDB() after _fullCache is written.
 * Skips dispatch entirely when no listeners are registered (common during
 * SSR or tests) to avoid the shallow-copy overhead.
 */
function notifyListeners(data: CaseStudy[]): void {
  if (_listeners.size === 0) return;
  // Freeze a copy — listeners cannot mutate the snapshot, and mutations to
  // the live _fullCache.data array cannot reach already-dispatched snapshots.
  const snapshot = Object.freeze([...data]) as ReadonlyArray<CaseStudy>;
  _listeners.forEach(listener => {
    try {
      listener(snapshot);
    } catch (err) {
      console.error('[caseStudyService] A cache update listener threw:', err);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
//
// Called before transform.  Invalid rows are dropped (with a warning) so
// they never reach the UI.  Non-fatal anomalies are warned and safe-defaulted.
//
// Duplicate warnings for the same row ID are suppressed across the lifetime
// of a single fetch so repeated revalidations do not spam the console when
// the DB has a known-bad row that cannot be fixed immediately.
// ─────────────────────────────────────────────────────────────────────────────

/** Known DB difficulty values — anything else is logged as an anomaly. */
const KNOWN_DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);

/**
 * Row IDs whose non-fatal validation warnings have already been emitted in
 * this fetch cycle.  Cleared at the start of every `fetchFromDB()` call so
 * warnings are re-evaluated against fresh data, but do not repeat N times
 * within a single fetch when the same bad row appears in multiple positions
 * (which Postgres should never produce, but defensive is cheap).
 */
const _warnedRowIds = new Set<string>();

/**
 * Returns `false` for structurally invalid rows that must be skipped.
 * Logs warnings (once per row per fetch cycle) for suspicious field values
 * that are non-fatal and can be safely defaulted.
 */
function validateRow(row: CaseStudyListRow): boolean {
  // id is the primary key — a row without one cannot be linked or rendered
  if (!row.id || typeof row.id !== 'string' || !row.id.trim()) {
    console.warn('[caseStudyService] Dropping row: missing or empty `id`');
    return false;
  }

  // Remaining checks are non-fatal; emit each only once per fetch cycle
  if (!_warnedRowIds.has(row.id)) {
    _warnedRowIds.add(row.id);

    if (!row.title) {
      console.warn(`[caseStudyService] id=${row.id}: missing title — will render as "Untitled"`);
    }

    if (row.difficulty && !KNOWN_DIFFICULTIES.has(row.difficulty)) {
      console.warn(
        `[caseStudyService] id=${row.id}: unexpected difficulty "${row.difficulty}" — defaulting to Medium`
      );
    }

    if (typeof row.attempts === 'number' && row.attempts < 0) {
      console.warn(
        `[caseStudyService] id=${row.id}: negative attempts (${row.attempts}) — clamped to 0`
      );
    }

    if (row.image_url !== null && row.image_url !== undefined) {
      const trimmed = typeof row.image_url === 'string' ? row.image_url.trim() : '';
      if (!trimmed) {
        console.warn(
          `[caseStudyService] id=${row.id}: image_url is empty/whitespace — will show placeholder`
        );
      }
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps the DB difficulty enum → UI label.
 * Exported so CaseDetailPage can reuse it without duplicating the switch.
 * Unrecognised values fall through to 'Medium' rather than throwing.
 */
export function mapDifficulty(raw: string | null | undefined): CaseDifficulty {
  switch (raw) {
    case 'Beginner':     return 'Easy';
    case 'Intermediate': return 'Medium';
    case 'Advanced':     return 'Hard';
    default:             return 'Medium';
  }
}

/** category column → first tag → 'General' */
function resolveCategory(row: CaseStudyListRow): string {
  if (row.category?.trim()) return row.category.trim();
  if (Array.isArray(row.tags) && row.tags.length > 0) return String(row.tags[0]);
  return 'General';
}

/**
 * Parse the `hints` jsonb column.
 * Accepts: proper string array, comma-separated string (legacy rows), null.
 */
function parseHints(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map(h => h.trim()).filter(Boolean);
  }
  return [];
}

/** Row → CaseStudy.  Assumes validateRow already approved this row. */
function transformListRow(row: CaseStudyListRow): CaseStudy {
  const resolvedLogo = getCaseStudyImageUrl(row.image_url);

  if (row.image_url && resolvedLogo === null) {
    // getCaseStudyImageUrl already warned about the specific reason; log the
    // case ID here once so it is easy to find the offending row in Supabase.
    console.warn(`[caseStudyService] id=${row.id}: image_url could not be resolved — showing placeholder`);
  }

  return {
    id: row.id,
    company: row.company?.trim() || 'Case Study',
    logo: resolvedLogo,
    title: row.title?.trim() || 'Untitled',
    description: row.problem_statement?.trim() || '',
    difficulty: mapDifficulty(row.difficulty),
    category: resolveCategory(row),
    // Clamp negative values — validateRow already warned about them
    attempts: typeof row.attempts === 'number' ? Math.max(0, row.attempts) : 0,
  };
}

/** Row → CaseStudyDetail.  Reuses transformListRow for all shared fields. */
function transformDetailRow(row: CaseStudyDetailRow): CaseStudyDetail {
  const base = transformListRow(row);
  return {
    ...base,
    background: row.background?.trim() || '',
    problem: row.problem_statement?.trim() || '',
    constraints: row.constraints?.trim() || '',
    expectedOutcome: row.expected_outcome?.trim() || '',
    hints: parseHints(row.hints),
    publishedDate: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        })
      : '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal fetch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a caught value into a user-facing error string.
 * In development the raw message is surfaced so failures are easy to diagnose.
 * In production a stable generic string is returned — no internal details leak.
 */
function toErrorString(context: string, err: unknown): string {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[caseStudyService] ${context}:`, err);
  return import.meta.env.DEV
    ? `Failed to load case studies (${context}): ${detail}`
    : 'Failed to load case studies. Please try again.';
}

/**
 * Execute the Supabase query, validate, transform, and — if no invalidation
 * occurred mid-flight — populate the cache.
 *
 * Race-condition guard
 * ────────────────────
 * The current `_cacheVersion` is captured before the network round-trip.
 * When the response arrives, the captured value is compared against the live
 * counter.  A mismatch means `invalidateCaseStudyCache()` was called while
 * this fetch was in-flight; in that case the result is returned to the
 * immediate caller (so it does not block) but is NOT written to `_fullCache`,
 * preventing a slow background fetch from silently overwriting a newer result.
 *
 * We always fetch ALL published rows (no DB-level LIMIT) so the cache is warm
 * for every caller regardless of the limit they requested.
 */
async function fetchFromDB(): Promise<CaseStudy[]> {
  // Snapshot version before any await so we can detect mid-flight invalidations
  const capturedVersion = _cacheVersion;

  // Reset per-cycle deduplication so fresh data gets a clean validation pass
  _warnedRowIds.clear();

  const { data, error } = await supabase
    .from('case_studies')
    // Explicit column list — never select('*') in production code.
    // Adding / removing a column is a deliberate decision visible in diff,
    // not an accidental side-effect of a schema change.
    .select(
      'id, title, company, image_url, problem_statement, difficulty, category, attempts, tags'
    )
    .eq('status', 'Published')
    .order('created_at', { ascending: false });

  // Supabase errors are returned, not thrown — re-throw so a single catch
  // block in the caller handles all failure modes uniformly.
  if (error) throw error;

  const cases = (data as CaseStudyListRow[])
    .filter(validateRow)
    .map(transformListRow);

  // ── Version guard ──────────────────────────────────────────────────────────
  if (_cacheVersion !== capturedVersion) {
    // An invalidation (or a newer fetch) changed the version while this request
    // was in-flight.  Discarding the result prevents older data from silently
    // overwriting a more up-to-date cache entry.
    console.warn(
      `[caseStudyService] Discarding fetch result: cache was invalidated mid-flight ` +
      `(started at v${capturedVersion}, current v${_cacheVersion}). ` +
      `A newer fetch will populate the cache.`
    );
    return cases; // still return to immediate callers — they get data, just not cached
  }

  // ── Cache size guard ───────────────────────────────────────────────────────
  if (cases.length > CACHE_SIZE_WARN_THRESHOLD) {
    console.warn(
      `[caseStudyService] Cache holds ${cases.length} case studies — ` +
      `exceeds the expected threshold of ${CACHE_SIZE_WARN_THRESHOLD}. ` +
      `Review DB contents or enable server-side pagination.`
    );
  }

  // Write the cache first, then notify.  This ordering guarantees that any
  // listener calling fetchCaseStudies() synchronously gets a cache hit rather
  // than triggering a redundant fetch.
  _fullCache = { data: cases, fetchedAt: Date.now() };
  notifyListeners(cases);
  return cases;
}

/**
 * Deduplicated fetch: returns the existing in-flight promise if one is active,
 * otherwise starts a new one.  The promise reference is cleared on settle so
 * a failing fetch is retried on the next call rather than replaying a cached
 * rejection.
 */
function fetchAndCache(): Promise<CaseStudy[]> {
  if (!_pendingFull) {
    _pendingFull = fetchFromDB().finally(() => {
      _pendingFull = null;
    });
  }
  return _pendingFull;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch published case studies, ordered by newest first.
 *
 * @param limit  Optional maximum rows to return.  Applied in-memory after the
 *               cache is populated — never affects how many rows are fetched.
 *
 * Cache behaviour (three states):
 *
 *  fresh  — data < 5 min old → returned immediately, no network call.
 *  stale  — data ≥ 5 min old but present → returned immediately (no spinner),
 *            one background revalidation fires (deduplicated).  The log entry
 *            includes the stale age so diagnosing slow-refresh issues is easy.
 *  empty  — no data → awaits a deduplicated fetch, then returns results.
 */
export async function fetchCaseStudies(limit?: number): Promise<FetchCaseStudiesResult> {
  const slice = (cases: CaseStudy[]) =>
    limit !== undefined ? cases.slice(0, limit) : cases;

  const state = getCacheState();

  if (state === 'fresh') {
    return { data: slice(_fullCache!.data), error: null };
  }

  if (state === 'stale') {
    const staleAgeMs = Date.now() - _fullCache!.fetchedAt;
    const staleAgeSec = Math.round(staleAgeMs / 1_000);

    // Serve the stale snapshot immediately — the UI never blocks.
    // fetchAndCache() is deduplicated: N concurrent stale callers still
    // produce exactly one in-flight request.
    fetchAndCache().catch(err => {
      // Not rethrown — background failure is non-fatal; stale data continues
      // to be served until the next successful revalidation.  The log entry
      // includes both the error and the cache age so the severity is clear.
      console.error(
        `[caseStudyService] Background revalidation failed ` +
        `(cache is ${staleAgeSec}s old, stale data will continue to be served). ` +
        `Error: ${err instanceof Error ? err.message : String(err)}`
      );
    });

    return { data: slice(_fullCache!.data), error: null };
  }

  // state === 'empty' — must wait for a (deduplicated) fetch
  try {
    const cases = await fetchAndCache();
    return { data: slice(cases), error: null };
  } catch (err) {
    return { data: [], error: toErrorString('fetchCaseStudies', err) };
  }
}

/**
 * Fetch the full detail for a single case study by ID.
 *
 * Returns `{ data: null, error: null }` when the row does not exist —
 * callers should treat this as a 404 (redirect or show an empty state).
 * Returns `{ data: null, error: string }` on any DB or network failure.
 */
export async function fetchCaseStudyById(
  id: string
): Promise<FetchCaseStudyDetailResult> {
  if (!id?.trim()) {
    return { data: null, error: 'Case study ID is required.' };
  }

  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select(
        'id, title, company, image_url, problem_statement, background, ' +
        'difficulty, category, attempts, tags, ' +
        'constraints, expected_outcome, hints, created_at'
      )
      .eq('id', id.trim())
      .single();

    if (error) throw error;
    if (!data) return { data: null, error: null };

    const row = data as CaseStudyDetailRow;
    if (!validateRow(row)) return { data: null, error: null };

    return { data: transformDetailRow(row), error: null };
  } catch (err) {
    return { data: null, error: toErrorString(`fetchCaseStudyById(${id})`, err) };
  }
}
