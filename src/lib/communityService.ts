// Supabase service for community comments and upvotes
import { supabase } from './supabase';

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
