// Supabase service for community comments, upvotes, and trending ideas
import { supabase } from './supabase';

// ── Trending Ideas ────────────────────────────────────────────────────────────

export interface TrendingIdea {
  id: string;
  title: string;
  tags: string[];
  authorName: string;
  authorAvatar?: string;
  upvotes: number;
  commentsCount: number;
  createdAt: string;
  trendingScore: number;
}

/** Compute trending score client-side from raw DB row values */
function computeTrendingScore(upvotes: number, comments: number, createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const recentBoost = ageHours < 24 ? 50 : ageHours < 72 ? 20 : 0;
  return upvotes * 3 + comments * 2 + recentBoost;
}

/**
 * Fetch top trending community ideas.
 * Fetches the 50 most recent posts and re-ranks them by trending score:
 *   (upvotes × 3) + (comments × 2) + recentBoost
 * where recentBoost is +50 if < 24h, +20 if < 72h, else 0.
 * Returns the top `limit` items (default 8).
 */
export async function fetchTrendingIdeas(limit = 8): Promise<{ data: TrendingIdea[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('community_ideas')
      .select('id, title, tags, author_name, author_avatar, upvotes_count, comments_count, created_at')
      .order('upvotes_count', { ascending: false })
      .limit(20);

    if (error) throw error;

    const scored: TrendingIdea[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      tags: row.tags ?? [],
      authorName: row.author_name ?? 'Anonymous',
      authorAvatar: row.author_avatar ?? undefined,
      upvotes: row.upvotes_count ?? 0,
      commentsCount: row.comments_count ?? 0,
      createdAt: row.created_at,
      trendingScore: computeTrendingScore(
        row.upvotes_count ?? 0,
        row.comments_count ?? 0,
        row.created_at,
      ),
    }));

    scored.sort((a, b) => b.trendingScore - a.trendingScore);
    return { data: scored.slice(0, limit), error: null };
  } catch (err: any) {
    if (import.meta.env.DEV) console.error('[communityService] fetchTrendingIdeas failed:', err);
    return { data: [], error: 'Failed to load trending ideas' };
  }
}

/**
 * Subscribe to realtime changes on `community_ideas`.
 * Calls `onChange` whenever any row is inserted, updated, or deleted.
 * Returns an unsubscribe function.
 */
export function subscribeTrendingIdeas(onChange: () => void): () => void {
  const channel = supabase
    .channel('trending_community_ideas')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'community_ideas' },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export interface CommunityComment {
  id: string;
  ideaId: string;
  authorId: string;
  author: string;
  avatar?: string;
  message: string;
  timestamp: string;
}

export interface CommunityUpvote {
  id: string;
  ideaId: string;
  userId: string;
  createdAt: string;
}

export async function fetchComments(ideaId: string): Promise<CommunityComment[]> {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('idea_id', ideaId)
      .order('timestamp', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (import.meta.env.DEV) console.error('[communityService] fetchComments failed:', error);
    return [];
  }
}

export async function addComment(comment: Omit<CommunityComment, 'id'>): Promise<CommunityComment | null> {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .insert(comment)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (error) {
    if (import.meta.env.DEV) console.error('[communityService] addComment failed:', error);
    return null;
  }
}

export async function fetchUpvotes(ideaId: string): Promise<CommunityUpvote[]> {
  try {
    const { data, error } = await supabase
      .from('community_upvotes')
      .select('*')
      .eq('idea_id', ideaId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (import.meta.env.DEV) console.error('[communityService] fetchUpvotes failed:', error);
    return [];
  }
}

export async function addUpvote(upvote: Omit<CommunityUpvote, 'id'>): Promise<CommunityUpvote | null> {
  try {
    const { data, error } = await supabase
      .from('community_upvotes')
      .insert(upvote)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  } catch (error) {
    if (import.meta.env.DEV) console.error('[communityService] addUpvote failed:', error);
    return null;
  }
}

export async function removeUpvote(ideaId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('community_upvotes')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', userId);
    return !error;
  } catch (error) {
    if (import.meta.env.DEV) console.error('[communityService] removeUpvote failed:', error);
    return false;
  }
}
