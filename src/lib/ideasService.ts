// Service for managing ideas/startups

import { supabase } from './supabase';
import { canFounderSubmitForReview } from './statusValidation';

export interface Idea {
  id: string;
  title: string;
  name?: string;
  stage: string;
  status: string;
  created_by: string;
  created_at: string;
}

// Get ideas for the logged-in user that have pitches (startups)
export const getUserIdeas = async (userId: string): Promise<Idea[]> => {
  try {
    // Get ideas for the specific user
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data with fallbacks for potentially missing columns
    const ideas = (data || []).map((idea: any) => ({
      id: idea.id,
      title: idea.title || idea.name || 'Untitled',
      name: idea.name || idea.title || 'Untitled',
      stage: idea.stage || 'idea',
      status: idea.status || 'draft',
      created_by: idea.created_by || userId,
      created_at: idea.created_at || new Date().toISOString(),
    }));
    return ideas;
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    return [];
  }
};

// Get single idea by ID
export const getIdeaById = async (id: string): Promise<Idea | null> => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching idea:', error);
    return null;
  }
};

// Update idea status
export const updateIdeaStatus = async (
  id: string,
  status: string,
  options?: { skipValidation?: boolean }
): Promise<Idea | null> => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('ideas')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentStatus = existing?.status;

    // GUARDRAIL: Validate founder status transitions (unless explicitly skipped)
    if (!options?.skipValidation && status === 'pending_review') {
      const validation = canFounderSubmitForReview(currentStatus);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const { data, error } = await supabase
      .from('ideas')
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
