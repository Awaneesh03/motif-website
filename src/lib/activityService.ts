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

// ── Icon + label map ──────────────────────────────────────────────────────────

export const ACTIVITY_META: Record<ActivityType, { icon: string; color: string }> = {
  idea_analyzed:     { icon: 'lightbulb', color: 'text-yellow-500' },
  pitch_created:     { icon: 'presentation', color: 'text-blue-500' },
  funding_submitted: { icon: 'banknote', color: 'text-green-500' },
  case_viewed:       { icon: 'book', color: 'text-purple-500' },
  community_action:  { icon: 'users', color: 'text-pink-500' },
  profile_updated:   { icon: 'user', color: 'text-muted-foreground' },
};

// ── Core helper ───────────────────────────────────────────────────────────────

/**
 * Fire-and-forget activity log. Never throws — safe to call anywhere.
 * Returns the inserted row id on success, null on failure.
 */
export async function logActivity(
  userId: string,
  type: ActivityType,
  title: string,
  metadata?: Record<string, unknown>,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_activity')
      .insert({ user_id: userId, type, title, metadata: metadata ?? null })
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
