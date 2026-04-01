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
 * - Resolves the user from the live Supabase session (no stale context).
 * - Two-layer dedup: in-memory (instant, same session) + DB check (cross-session).
 *   Both use a 10-second window keyed on `type:title`.
 * - title is optional; omit to use the default label from ACTIVITY_META.
 *
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

    const resolvedTitle = title?.trim() || ACTIVITY_META[type].label;
    const dedupKey = `${type}:${resolvedTitle}`;

    // ── Layer 1: in-memory dedup (instant, no network) ───────────────────────
    if (_isDuplicate(user.id, type, resolvedTitle)) {
      return null;
    }

    // ── Layer 2: DB dedup (cross-session / cross-device) ─────────────────────
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
      // Continue to insert — a failed check is not a reason to drop the event
    } else if (existing && existing.length > 0) {
      return null; // DB duplicate within window
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id:   user.id,
        type,
        title:     resolvedTitle,
        metadata:  metadata ?? null,
        dedup_key: dedupKey,
      })
      .select('id')
      .single();

    if (error) {
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
 * Fetches the most recent activity events for a user.
 * Always resolves — returns [] on error.
 */
export async function getRecentActivity(
  userId: string,
  limit = 20,
): Promise<ActivityEvent[]> {
  try {
    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[activityService] fetch failed:', error.message);
      return [];
    }
    return (data ?? []) as ActivityEvent[];
  } catch (e) {
    console.warn('[activityService] unexpected error:', e);
    return [];
  }
}
