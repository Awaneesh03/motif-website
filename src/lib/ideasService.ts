// Service for managing ideas/startups
// Uses idea_analyses table which stores analyzed startup ideas

import { supabase } from './supabase';
import { canFounderSubmitForReview } from './statusValidation';

export interface Idea {
  id: string;
  title: string;
  name?: string;
  stage: string;
  status: string;
  user_id: string;  // Changed from created_by to match idea_analyses schema
  created_at: string;
}

// Get ideas for the logged-in user from idea_analyses table
export const getUserIdeas = async (userId: string): Promise<Idea[]> => {
  try {
    // Get analyzed ideas for the specific user from idea_analyses table
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user ideas from idea_analyses:', error);
      // Return empty array instead of throwing - table might not exist yet
      return [];
    }

    // Transform data with fallbacks for potentially missing columns
    const ideas = (data || []).map((idea: any) => ({
      id: idea.id,
      title: idea.title || idea.name || 'Untitled',
      name: idea.name || idea.title || 'Untitled',
      stage: idea.stage || 'idea',
      status: idea.status || 'draft',
      user_id: idea.user_id || userId,
      created_at: idea.created_at || new Date().toISOString(),
    }));
    return ideas;
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    return [];
  }
};

// Get single idea by ID from idea_analyses table
export const getIdeaById = async (id: string): Promise<Idea | null> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching idea:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error fetching idea:', error);
    return null;
  }
};

// Update idea status in idea_analyses table
export const updateIdeaStatus = async (
  id: string,
  status: string,
  options?: { skipValidation?: boolean }
): Promise<Idea | null> => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('idea_analyses')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching idea for status update:', fetchError);
      throw fetchError;
    }

    const currentStatus = existing?.status;

    // GUARDRAIL: Validate founder status transitions (unless explicitly skipped)
    if (!options?.skipValidation && status === 'pending_review') {
      const validation = canFounderSubmitForReview(currentStatus);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const { data, error } = await supabase
      .from('idea_analyses')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating idea status:', error);
    // Re-throw to allow caller to handle
    throw error;
  }
};
