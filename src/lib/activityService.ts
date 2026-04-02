import { supabase } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'idea_analyzed'
  | 'pitch_created'
  | 'funding_submitted'
  | 'case_viewed'
  | 'community_action'
  | 'profile_updated';

export interface ActivityEvent {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── Activity metadata (icon, color, default label) ────────────────────────────

export const ACTIVITY_META: Record<ActivityType, { icon: string; color: string; label: string }> = {
  idea_analyzed:     { icon: 'lightbulb',     color: 'text-yellow-500',        label: 'Idea analyzed' },
  pitch_created:     { icon: 'presentation',  color: 'text-blue-500',          label: 'Pitch deck generated' },
  funding_submitted: { icon: 'banknote',      color: 'text-green-500',         label: 'Funding submitted' },
  case_viewed:       { icon: 'book',          color: 'text-purple-500',        label: 'Case study viewed' },
  community_action:  { icon: 'users',         color: 'text-pink-500',          label: 'Community interaction' },
  profile_updated:   { icon: 'user',          color: 'text-muted-foreground',  label: 'Profile updated' },
};

// ── Dedup cache ───────────────────────────────────────────────────────────────
// Prevents the same event from being logged twice within a short window
// (e.g. double-click, React StrictMode double-invoke, rapid navigation).
// Module-level Map — survives re-renders, cleared on page reload.

const DEDUP_WINDOW_MS = 10_000; // 10 seconds
const _recentKeys = new Map<string, number>(); // `userId:type:title` → logged timestamp

function _isDuplicate(userId: string, type: ActivityType, title: string): boolean {
  const key = `${userId}:${type}:${title}`;
  const last = _recentKeys.get(key);
  const now = Date.now();

  if (last !== undefined && now - last < DEDUP_WINDOW_MS) {
    return true; // already logged within the window — skip
  }

  // Record this attempt and evict stale entries to cap memory usage
  _recentKeys.set(key, now);
  if (_recentKeys.size > 200) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [k, ts] of _recentKeys) {
      if (ts < cutoff) _recentKeys.delete(k);
    }
  }
  return false;
}

// ── Core helper ───────────────────────────────────────────────────────────────

/**
 * Fire-and-forget activity log. Never throws — safe to call anywhere.
 *
 * Three-layer dedup (10-second window):
 *   Layer 1 — in-memory Map (0ms, same session)
 *   Layer 2 — DB SELECT on dedup_key (cross-session/device)
 *   Layer 3 — DB unique index on (user_id, dedup_key, dedup_bucket);
 *             concurrent inserts that slip past Layer 2 get a 23505 — silently ignored
 *
 * title is optional; omit to use the default label from ACTIVITY_META.
 * Returns the inserted row id on success, null on skip or failure.
 */
export async function logActivity(
  type: ActivityType,
  title?: string,
  metadata?: Record<string, unknown>,
): Promise<string | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn('[activityService] no authenticated user — skipping log');
      return null;
    }

    const resolvedTitle  = title?.trim() || ACTIVITY_META[type].label;
    const dedupKey       = `${type}:${resolvedTitle}`;
    const dedupBucket    = Math.floor(Date.now() / 10_000); // 10-second window

    // ── Layer 1: in-memory dedup (instant, no network) ───────────────────────
    if (_isDuplicate(user.id, type, resolvedTitle)) {
      return null;
    }

    // ── Layer 2: DB SELECT dedup (cross-session / cross-device) ──────────────
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
    const { data: existing, error: checkError } = await supabase
      .from('user_activity')
      .select('id')
      .eq('user_id', user.id)
      .eq('dedup_key', dedupKey)
      .gte('created_at', tenSecondsAgo)
      .limit(1);

    if (checkError) {
      console.warn('[activityService] dedup check failed:', checkError.message);
      // Do not drop the event — proceed to insert
    } else if (existing && existing.length > 0) {
      return null;
    }

    // ── Layer 3: INSERT — unique index (user_id, dedup_key, dedup_bucket) ────
    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id:      user.id,
        type,
        title:        resolvedTitle,
        metadata:     metadata ?? null,
        dedup_key:    dedupKey,
        dedup_bucket: dedupBucket,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        console.info('[activityService] duplicate prevented by DB constraint');
        return null;
      }
      console.warn('[activityService] insert failed:', error.message);
      return null;
    }

    return data?.id ?? null;
  } catch (e) {
    console.warn('[activityService] unexpected error:', e);
    return null;
  }
}

// ── Feed fetch ────────────────────────────────────────────────────────────────

/**
 * Opaque composite cursor capturing (created_at, id) — the two columns the
 * feed is ordered by. Using both fields eliminates the "same-timestamp" gap
 * problem: if two events share the same created_at, the single-field cursor
 * would either skip or duplicate one of them depending on page boundaries.
 */
export interface ActivityCursor {
  created_at: string; // ISO 8601 timestamptz
  id: string;         // UUID — used as tie-breaker (lexicographic DESC)
}

export interface ActivityPage {
  events: ActivityEvent[];
  /**
   * Pass as `cursor` to the next call to fetch the page after this one.
   * `null` means there are no more events to load.
   */
  nextCursor: ActivityCursor | null;
}

/**
 * Fetches a page of activity events for a user.
 *
 * Composite cursor pagination over (created_at DESC, id DESC):
 *   page 1  → no cursor
 *   page N  → cursor = { created_at, id } of the last event on page N-1
 *
 * The composite WHERE clause is equivalent to:
 *   created_at < cursor.created_at
 *   OR (created_at = cursor.created_at AND id < cursor.id)
 *
 * This guarantees no rows are skipped or duplicated even when multiple
 * events share the exact same created_at timestamp.
 *
 * Always resolves — returns an empty page on error.
 */
export async function getRecentActivity(
  userId: string,
  limit = 10,
  cursor?: ActivityCursor,
): Promise<ActivityPage> {
  try {
    // Fetch one extra row to cheaply detect whether a next page exists
    let query = supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id',         { ascending: false }) // stable tie-break
      .limit(limit + 1);

    if (cursor) {
      // PostgREST composite cursor:
      // rows WHERE created_at < cursor OR (created_at = cursor AND id < cursorId)
      query = query.or(
        `created_at.lt.${cursor.created_at},` +
        `and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[activityService] fetch failed:', error.message);
      return { events: [], nextCursor: null };
    }

    const rows    = (data ?? []) as ActivityEvent[];
    const hasMore = rows.length > limit;
    const events  = rows.slice(0, limit);
    const last    = events.length > 0 ? events[events.length - 1] : null;
    const nextCursor: ActivityCursor | null = hasMore && last
      ? { created_at: last.created_at, id: last.id }
      : null;

    return { events, nextCursor };
  } catch (e) {
    console.warn('[activityService] unexpected error:', e);
    return { events: [], nextCursor: null };
  }
}

// ── Merge utility ─────────────────────────────────────────────────────────────

/**
 * Merges two lists of activity events, deduplicates by id, and returns the
 * result sorted by created_at DESC (id DESC as tie-break), capped at `limit`.
 *
 * Safe to call on every reconnect or periodic sync — never produces duplicates
 * or changes the order of events already visible to the user.
 */
export function mergeActivityEvents(
  existing: ActivityEvent[],
  incoming: ActivityEvent[],
  limit = 10,
): ActivityEvent[] {
  const seen   = new Set(existing.map(e => e.id));
  const merged = [...incoming.filter(e => !seen.has(e.id)), ...existing];
  merged.sort((a, b) => {
    const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return diff !== 0 ? diff : b.id.localeCompare(a.id);
  });
  return merged.slice(0, limit);
}
